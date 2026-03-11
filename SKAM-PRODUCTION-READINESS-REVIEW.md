# SKAM Production Readiness Review

**Reviewer:** Claude · **Date:** 2026-03-11  
**Scope:** Full-stack review — Backend API, Frontend, Security, Performance, Design System, Deployment

---

## Executive Summary

The SKAM codebase is **well-architected and close to production-ready** for an MVP. The code is clean, consistently structured, and shows a mature understanding of NestJS and Next.js patterns. Security posture is strong with proper input validation, rate limiting, CORS, CSP headers, and JWT token revocation. The design system is cohesive with a well-defined dark neon aesthetic.

However, there are **~20 issues that should be addressed before production launch**, ranging from critical security gaps to functional bugs and performance concerns. None are show-stoppers, but several could cause real problems under production traffic.

**Verdict: 🟡 Near-Ready — address Critical and High items before launch.**

---

## 1. CRITICAL Issues (Fix Before Launch)

### 1.1 🔴 StorageService crashes the entire app at startup if R2 env vars are missing

**File:** `apps/api/src/storage/storage.service.ts` (constructor)

The `StorageService` constructor throws a hard `Error("Thiếu cấu hình lưu trữ R2")` if R2 credentials are not set. Since this service is injected via NestJS DI, this will **crash the entire API at startup** — not just the storage module.

**Fix:** Make R2 optional. Log a warning and disable storage operations gracefully:

```typescript
// constructor
this.enabled = Boolean(endpoint && accessKeyId && secretAccessKey);
if (!this.enabled) {
  this.logger.warn('R2 storage not configured — uploads disabled');
}
```

Then guard all public methods with `if (!this.enabled) throw new ServiceUnavailableException(...)`.

---

### 1.2 🔴 `bankIdentifier` validation mismatch between frontend and backend

**Backend DTO** (`create-case.dto.ts`): `@Matches(/^\d{8,20}$/)` — requires 8–20 digits.  
**Frontend schema** (`report-form.schema.ts`): `z.string().min(6).max(40)` — allows 6 characters, allows non-digits.  
**Shared schema** (`case.schema.ts`): `z.string().min(6).max(40)` — same as frontend.

This means users can fill out the form with values like `ABCDEF` or 6-digit numbers, submit, and get a 400 error from the backend with no clear explanation.

**Fix:** Align all three:
- Update the frontend schema to match backend: `z.string().regex(/^\d{8,20}$/, "Số tài khoản phải từ 8-20 chữ số")`
- Update shared schema similarly.

---

### 1.3 🔴 Admin token stored in httpOnly cookie but SSR pages make API calls with it — token leaks if API is on a different domain

**Files:** `apps/web/lib/admin-auth.ts`, `apps/web/app/api/admin/session/route.ts`

The admin token is correctly stored in an httpOnly, sameSite=strict cookie. However, the server-side admin pages (`admin/page.tsx`, `admin/cases/page.tsx`, etc.) read this cookie and pass it directly to `fetch()` calls to the NestJS API. This works, but:

- If the API is on a different domain (e.g., `api.skam.vn` vs `skam.vn`), the token is sent in plaintext across the wire in the `Authorization` header from Vercel's serverless functions to the API.
- The cookie `maxAge` is 24h but the JWT also has 24h TTL — there's no mismatch currently, but if either changes, sessions could silently break.

**Recommendation:** Ensure API and frontend are on the same domain or behind a proxy in production. Document this requirement in `.env.example`.

---

### 1.4 🔴 `updateManyAndReturn` is a Prisma v7-specific method — verify Turso/libSQL adapter supports it

**File:** `apps/api/src/admin/admin.service.ts` (lines in approveCase and rejectCase)

`updateManyAndReturn` is relatively new in Prisma. The libSQL adapter may not fully support this operation. If it throws at runtime, approve/reject will silently fail.

**Fix:** Test this specific flow against Turso in staging. If unsupported, fall back to a `updateMany` + separate `findUnique` pattern.

---

## 2. HIGH Priority Issues

### 2.1 🟠 Public analytics endpoint leaks `totalPendingCases` count

**File:** `apps/api/src/analytics/analytics.service.ts`

The public `/analytics/summary` endpoint returns `totalPendingCases`. This tells attackers exactly how many unmoderated reports exist, which could be used for:
- Gauging moderation response times
- Timing spam campaigns when the moderation queue is already large

**Fix:** Remove `totalPendingCases` from the public summary. Only expose it via the admin analytics endpoint.

---

### 2.2 🟠 SQL injection safety — `$queryRaw` usage in `searchCases`

**File:** `apps/api/src/cases/cases.service.ts`

The raw SQL queries use tagged template literals (`$queryRaw\`...\``), which Prisma parameterizes automatically — this is safe. However, the `searchPattern` is constructed with string concatenation:

```typescript
const searchPattern: string = `%${escaped}%`;
```

While the `escaped` variable does handle `%`, `_`, and `\`, the pattern is then passed via Prisma's tagged template parameterization, so it IS safe. But this is fragile — if anyone refactors this to `$queryRawUnsafe`, it becomes exploitable.

**Recommendation:** Add a comment explaining why this is safe, and add a lint rule or code review check for `$queryRawUnsafe`.

---

### 2.3 🟠 No CSRF protection on state-mutating POST endpoints

**File:** `apps/api/src/common/request-origin.ts`

The `assertAllowedWriteOrigin` only checks `Origin`/`Referer` headers, which is a good first line, but:
- It's only applied to `createCase` in the cases controller and `presign` in storage
- It's NOT applied to admin endpoints (approve, reject, refine, delete)
- Admin endpoints rely solely on the JWT token

Since admin uses httpOnly cookies, and the JWT is extracted from the `Authorization` header (not the cookie), admin endpoints are NOT vulnerable to CSRF. This is actually fine — but document this architectural decision.

---

### 2.4 🟠 `getApiBaseUrl()` runs at import time on both server and client

**File:** `apps/web/lib/api.ts` line 4

```typescript
export const apiUrl: string = getApiBaseUrl();
```

This is evaluated once when the module is first imported. On the server (Next.js SSR), `process.env.NEXT_PUBLIC_API_URL` is available. On the client, only `NEXT_PUBLIC_*` vars are inlined at build time. This works correctly BUT:

- The `getApiBaseUrl()` function has logic that appends `/api/v1` — if the env var already includes it, you'd get `/api/v1/api/v1`. The code handles this, but there's a subtle edge case where a trailing slash on `NEXT_PUBLIC_API_URL` causes double-slash issues.

**Fix:** Add a unit test for `getApiBaseUrl()` with various edge cases: `"http://api.skam.vn"`, `"http://api.skam.vn/"`, `"http://api.skam.vn/api/v1"`, `"http://api.skam.vn/api/v1/"`.

---

### 2.5 🟠 No error handling in admin server actions

**File:** `apps/web/app/(admin)/admin/cases/[id]/page.tsx`

The server actions (`refineAction`, `approveAction`, `rejectAction`) don't wrap their API calls in try/catch. If `approveAdminCase` throws (e.g., network error, race condition), the user gets an unhandled Next.js error page instead of a friendly message.

**Fix:** Wrap each action in try/catch and return an error state, or use Next.js `useFormState` pattern.

---

### 2.6 🟠 Shared package import paths are inconsistent

The frontend uses two different import patterns:
- `import { CaseStatus } from "@skam/shared/types"` (most files)
- Backend uses: `import { CaseStatus } from "@skam/shared/src/types"`

The shared package `exports` field in `packages/shared/package.json` should be checked to ensure both paths work. If the package only exports from `src/`, the frontend imports without `/src/` will fail at build time.

**Fix:** Verify the `exports` map in `packages/shared/package.json` covers all import paths used across the monorepo.

---

## 3. MEDIUM Priority Issues

### 3.1 🟡 Rate limiting keys can be manipulated by spoofing proxy headers

**File:** `apps/api/src/common/request-identifier.ts`

When `TRUST_PROXY_HEADERS=true`, the identifier is taken from `x-vercel-forwarded-for`. This is correct for Vercel deployments, but:
- The validation only checks for `[0-9a-fA-F:.]` and length ≤ 128
- An attacker behind a non-Vercel proxy could send arbitrary values to bypass per-IP rate limits

**Recommendation:** In production, ensure `TRUST_PROXY_HEADERS` is only enabled when behind a trusted proxy (Vercel, Cloudflare). Document this.

---

### 3.2 🟡 Homepage makes 2 API calls on every SSR render without caching

**File:** `apps/web/app/page.tsx`

```typescript
const [summary, recent] = await Promise.all([
  getSummary().catch(() => null),
  getRecentCases(1, 6).catch(() => null),
]);
```

Both use `next: { revalidate: 60 }` which is good — Next.js ISR will cache for 60 seconds. This is acceptable for MVP, but under load, the API will still receive bursts of requests every 60 seconds from all edge regions.

**Recommendation:** Consider adding Redis caching on the API side for the analytics summary endpoint (the `SystemStats` singleton query is already cheap, so this is low priority).

---

### 3.3 🟡 Telegram notifier `notifyNewCase` fails silently 

**File:** `apps/api/src/cases/cases.service.ts`

```typescript
this.telegramNotifier.notifyNewCase(result).catch(() => {});
```

Failed Telegram notifications are silently swallowed. In production, you'd want to know if Telegram notifications stop working.

**Fix:** The `TelegramNotifierService` already logs warnings internally, so this is acceptable. But the empty `.catch(() => {})` should at least log at debug level in the calling code.

---

### 3.4 🟡 `presignUpload` Turnstile verification is optional even when Turnstile is enabled

**File:** `apps/api/src/storage/storage.controller.ts`

```typescript
if (this.turnstileService.isEnabled()) {
  const turnstileToken = ...;
  if (turnstileToken) {  // <-- only verifies IF a token is provided
    ...
  }
}
```

This means if Turnstile is enabled but the client doesn't send a token, the upload proceeds without bot verification. The case creation endpoint correctly rejects missing tokens — the upload endpoint should too.

**Fix:** If Turnstile is enabled and no token is provided, reject the request.

---

### 3.5 🟡 `CacheService.fixedWindowLimit` race condition

**File:** `apps/api/src/cache/cache.service.ts`

```typescript
const count: number = await this.redis.incr(key);
if (count === 1) await this.redis.expire(key, windowSeconds);
```

There's a tiny race window between `INCR` and `EXPIRE`. If the process crashes after `INCR` but before `EXPIRE` on a new key, the key persists forever with no TTL, permanently blocking that rate limit key.

**Fix:** Use a Lua script or Upstash's built-in rate limiter:
```typescript
// Atomic approach
await this.redis.eval(
  `local c = redis.call('incr', KEYS[1])
   if c == 1 then redis.call('expire', KEYS[1], ARGV[1]) end
   return c`,
  [key], [windowSeconds]
);
```

Or use `@upstash/ratelimit` which handles this correctly.

---

### 3.6 🟡 No pagination on admin cases list in `listAdminCases` API call from frontend

**File:** `apps/web/app/(admin)/admin/cases/page.tsx`

The admin cases page calls `listAdminCases(token, status)` without passing `page` or `pageSize`, defaulting to page 1, 20 items. There's no pagination UI on this page (unlike the admin dashboard page which has pagination).

**Fix:** Add pagination controls, or at least increase the default `pageSize` to 50 for the admin view.

---

## 4. DESIGN SYSTEM & UI Review

### 4.1 ✅ Design tokens are well-defined and consistently applied

The CSS custom properties in `globals.css` form a comprehensive design token system covering:
- Surface hierarchy (`--surface-0` through `--surface-4`)
- Text hierarchy (`--text-primary`, `--text-secondary`, `--text-tertiary`)
- Status colors with both foreground and background variants
- Glass morphism tokens (`--glass-bg`, `--glass-blur`, `--glass-border`)
- Animation tokens with proper reduced-motion support
- Shadow system including neon glow variants

All UI components consistently reference these tokens rather than hardcoding values. The `@theme inline` block properly maps them to Tailwind v4 CSS variables.

### 4.2 ✅ Vietnamese typography is properly configured

- Inter font with `vietnamese` subset — correct
- JetBrains Mono for monospace with Vietnamese support
- `line-height: 1.6` on body — meets the minimum 1.5 requirement for Vietnamese diacritics
- `lang="vi"` on the HTML element — good for SEO and screen readers

### 4.3 🟡 Component API inconsistencies

- `GlassCard` uses `variant` prop with `"default" | "elevated" | "neon"`
- `Button` uses `variant` with a different set including `"neon" | "neon-outline" | "danger" | "ghost"`
- `Card` has no variant prop at all — it's just a simple glass container

This is mostly fine, but the `Card` vs `GlassCard` distinction is unclear. In practice, `Card` and `GlassCard({ variant: "default" })` produce nearly identical output.

**Recommendation:** Consider merging `Card` into `GlassCard` with a `variant="minimal"` option, or document when to use which.

### 4.4 🟡 `StatusBadge` semantic mapping may confuse users

```typescript
const caseStatusMap = {
  [CaseStatus.APPROVED]: "danger",  // Verified scam → Danger
  [CaseStatus.REJECTED]: "safe",    // Rejected report → Safe
  [CaseStatus.PENDING]: "pending",
};
```

This is a deliberate design decision (approved scam = dangerous account), but the badge label shows "Nguy hiểm" for approved cases. From an admin perspective this makes sense, but a public user seeing "Nguy hiểm" might not understand that this means "confirmed scam" vs "this page is dangerous."

**Recommendation:** Consider adding a small tooltip or subtitle like "Lừa đảo đã xác nhận" underneath approved badges.

### 4.5 ✅ Responsive design is solid

- Mobile-first approach with `sm:`, `md:`, `lg:` breakpoints
- Container with responsive padding (`1rem` → `1.5rem` → `2rem`)
- Grid layouts collapse properly on mobile
- Touch-friendly button sizes (`h-9` minimum, `h-14` for search input)

### 4.6 ✅ Accessibility basics are covered

- `aria-label` on nav links and logo
- `aria-hidden="true"` on decorative elements (AmbientGlow)
- `role="img"` and `aria-label` on StatusBadge
- `:focus-visible` with neon outline for keyboard navigation
- `prefers-reduced-motion` support disabling animations

---

## 5. SECURITY Posture

### 5.1 ✅ Strong points

| Area | Implementation | Status |
|------|---------------|--------|
| Input validation | class-validator DTOs with strict whitelist | ✅ Solid |
| CORS | Configurable origins, required in production | ✅ Solid |
| CSP | Comprehensive policy in next.config.ts | ✅ Solid |
| Security headers | Helmet + HSTS + X-Frame-Options + X-Content-Type-Options | ✅ Solid |
| JWT auth | HS256, JTI claim, issuer/audience validation, token revocation via Redis | ✅ Solid |
| Rate limiting | Per-endpoint with Redis fixed-window, per-IP isolation | ✅ Solid |
| Privacy | Reporter IPs hashed with SHA-256 + salt, no PII stored | ✅ Solid |
| Bot protection | Cloudflare Turnstile integration | ✅ Solid |
| Production env checks | Hard fail on missing secrets in production | ✅ Solid |
| Cookie security | httpOnly, sameSite=strict, secure in production | ✅ Solid |
| Admin access | GitHub OAuth + username whitelist | ✅ Solid |
| File uploads | Content-type allowlist, extension validation, size limits, hash dedup | ✅ Solid |

### 5.2 🟡 Gaps to address

- **No request body size limit:** NestJS doesn't limit request body by default. Large payloads could cause OOM. Add `app.use(json({ limit: '1mb' }))` in bootstrap.
- **Login code regex allows up to 128 hex chars:** The `exchangeAdminLoginCode` validates `/^[a-f0-9]{32,128}$/` but actual codes are 48 hex chars (24 bytes). Tighten to `{48}`.
- **No `Permissions-Policy` for payment/USB/etc:** The CSP covers camera/microphone/geolocation, but could also restrict payment, USB, etc.
- **Admin logout doesn't invalidate cookie on the API side first:** The `LogoutButton` calls `DELETE /api/admin/session` which only clears the cookie. It should also call the backend `POST /auth/logout` to revoke the JWT.

---

## 6. PERFORMANCE Review

### 6.1 ✅ Strong points

- ISR caching (`revalidate: 60`) on homepage and recent cases
- Bank data triple-cache (memory → Redis → stale Redis → VietQR API)
- Inflight request deduplication for bank API calls
- Database indexes on all queried columns
- SystemStats singleton pattern avoids repeated aggregate queries
- `Cache-Control: public, max-age=3600` on banks endpoint

### 6.2 🟡 Potential bottlenecks

- **`rebuildProfileAndStats` runs in every approve/reject/delete transaction:** This triggers 5+ database queries inside the transaction. With high moderation volume, this could slow down. Consider moving stats rebuilds to an async job.
- **Search uses `LIKE %query%`:** This forces a full table scan on `ScamCase`. For MVP this is fine, but with 10k+ rows it will degrade. Plan for full-text search (SQLite FTS5 or move search to a dedicated service).
- **No connection pooling documentation:** Turso/libSQL handles connections differently from Postgres. Ensure the adapter is configured for Vercel's serverless model where each invocation might create a new connection.

---

## 7. API CORRECTNESS

### 7.1 ✅ RESTful design is clean

- Proper HTTP verbs (GET, POST, PATCH, DELETE)
- Consistent response envelope `{ success, data, error }`
- Pagination follows a consistent `{ page, pageSize, total, totalPages }` pattern
- Error messages are in Vietnamese — good for the target audience

### 7.2 🟡 Issues

- **`GET /cases/:id` returns 404 for non-approved cases** but **`GET /admin/cases/:id` returns all statuses.** This is correct behavior but the public endpoint doesn't explain WHY (user might think the case doesn't exist vs. still pending). Consider returning a specific message like "Vụ việc đang chờ duyệt."
- **`searchCases` requires minimum 3 characters** (`@MinLength(3)` on `q`). Vietnamese account numbers are 8+ digits, so this is fine. But bank codes are 2-3 chars (e.g., "VCB"), which means searching by just bank code via the query field would fail. The `bankCode` filter parameter handles this, so it's acceptable.
- **`PaginateCaseDto` defaults don't match `SearchCaseDto` defaults**: Both have `page=1` but paginate has `pageSize=10` while search also has `pageSize=10`. This is actually consistent — I was wrong. ✅

---

## 8. CODE QUALITY

### 8.1 ✅ Strengths

- Consistent TypeScript with strict types — no `any` usage
- Explicit return types on all service methods
- Proper separation of concerns (controllers → services → DTOs)
- Shared package for types/schemas/utils avoids duplication
- Error messages consistently in Vietnamese
- All env vars have fallbacks or explicit production checks

### 8.2 🟡 Minor quality issues

- **Dead code:** `packages/shared/src/schemas/case.schema.ts` defines `createCaseSchema` but the backend uses class-validator DTOs instead. The shared Zod schema is only used by the frontend. Remove the shared one or migrate backend to Zod.
- **Unused imports potential:** `packages/shared/src/utils/hash.ts` exports `hashSHA256` but the backend has its own `hashValue` private method. The shared util is never imported.
- **Test coverage is minimal:** Only `cases.service.test.ts` (unit) and `app.e2e.ts` (integration). No tests for admin flows, auth, storage, or frontend components.

---

## 9. DEPLOYMENT READINESS

### 9.1 ✅ Ready

- Vercel config files present for both `apps/web` and `apps/api`
- Production env validation in `main.ts`
- CSP configured for Cloudflare Turnstile domains
- `.env.example` is comprehensive

### 9.2 🟡 Needs attention

- **No `vercel.json` rewrites for the NestJS API:** The API's `vercel.json` only has `{ "version": 2 }`. NestJS on Vercel needs a build step and serverless function configuration. Verify deployment works.
- **Missing `TRUST_PROXY_HEADERS=true` for Vercel:** Since Vercel sits behind a proxy, you MUST set this to get real client IPs for rate limiting. Without it, all requests share the same rate limit key.
- **No health check monitoring setup:** The `/health/ready` endpoint exists but there's no mention of uptime monitoring (e.g., Vercel Cron, Better Uptime).

---

## 10. ACTION ITEMS (Priority Order)

### Must fix before launch:
1. Make StorageService R2 config optional (crash-on-startup bug)
2. Align `bankIdentifier` validation across frontend/backend/shared
3. Test `updateManyAndReturn` against Turso adapter
4. Set `TRUST_PROXY_HEADERS=true` for Vercel deployment
5. Add request body size limit in bootstrap

### Should fix before launch:
6. Remove `totalPendingCases` from public analytics
7. Make upload Turnstile verification mandatory when enabled
8. Add error handling to admin server actions
9. Fix admin logout to also revoke JWT on backend
10. Verify shared package export paths work for both import styles

### Nice to have for MVP:
11. Atomic rate limiting with Lua script or `@upstash/ratelimit`
12. Add pagination to admin cases list page
13. Add comment explaining SQL injection safety in searchCases
14. Merge Card/GlassCard components
15. Add unit tests for `getApiBaseUrl()` edge cases

---

*End of review. The codebase shows strong engineering fundamentals — the issues above are refinements, not rewrites. Ship confidently after addressing the Critical items.*
