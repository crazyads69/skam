# SKAM Production Readiness Review

**Reviewer:** Claude · **Date:** 2026-03-11
**Scope:** Full-stack review — Backend (NestJS), Frontend (Next.js), Shared packages, Security, Performance, Design System compliance

---

## Executive Summary

The codebase is **well-architected for an MVP** with strong security foundations (hashed PII, origin checks, rate limiting everywhere, CSP headers, Turnstile). However, there are **17 critical/high issues** and **~25 medium issues** that should be addressed before production launch. The most urgent are around auth token management, missing input sanitization vectors, database query safety, and several frontend UX gaps.

**Verdict:** Not production-ready yet. Estimated 3–5 days of focused work to reach launch-ready state.

---

## 1. CRITICAL Issues (Must Fix Before Launch)

### 1.1 Auth: Login code stored in-memory — breaks on multi-instance/serverless

**File:** `apps/api/src/auth/auth.service.ts` lines 11–12

The `inMemoryLoginCodes` Map only works on a single server instance. On Vercel serverless (your deployment target), the GitHub callback may hit a different instance than the code exchange, causing login to fail silently.

**Fix:** Remove the in-memory fallback entirely. Rely solely on Redis (`cache.set`/`cache.get`) which you already implement. The in-memory map is a dev convenience that will cause intermittent production login failures.

### 1.2 Auth: Logout endpoint is a no-op

**File:** `apps/api/src/auth/auth.controller.ts` — `logout()`

The logout endpoint returns `{ revoked: true }` but does absolutely nothing. The JWT remains valid for 24 hours. Anyone with a leaked token has persistent access.

**Fix:** Implement a token denylist in Redis. On logout, store the JWT's `jti` (you'll need to add one to `issueAdminToken`) with TTL matching the token's remaining lifetime. Check the denylist in `AdminGuard.canActivate`.

### 1.3 CORS: Missing `credentials: true` in CORS config

**File:** `apps/api/src/bootstrap.ts`

You call `app.enableCors({ origin: corsOrigins })` without `credentials: true`. The admin cookie-based auth flow (`skam_admin_token` cookie) requires CORS credentials for cross-origin requests to work. Without this, the browser will strip cookies from API requests.

**Fix:** Add `credentials: true` to the CORS options.

### 1.4 Database: `ScammerProfile.bankIdentifier` is `@unique` but not scoped to `bankCode`

**File:** `apps/api/prisma/schema.prisma`

Two different banks could theoretically have the same account number. The `bankIdentifier` alone as a unique constraint means if bank A account `123456789` is reported, bank B account `123456789` can never be created as a separate profile.

**Fix:** Replace `@unique` on `bankIdentifier` with a compound unique: `@@unique([bankIdentifier, bankCode])`. Update all `findUnique({ where: { bankIdentifier } })` calls in `admin.service.ts` and `profiles.service.ts` to use the compound key.

### 1.5 Search: Raw `LIKE` pattern allows SQL wildcard injection

**File:** `apps/api/src/cases/cases.service.ts` — `searchCases()`

The search query builds `%${rawQuery.toLowerCase()}%` and passes it to `$queryRaw`. While Prisma's tagged template does parameterize values (preventing SQL injection), the user can inject `%` and `_` wildcards in their search term. A query of `%` returns all approved cases, and `_` matches any character — this leaks data and creates performance issues.

**Fix:** Escape LIKE special characters before building the pattern:
```typescript
const escaped = rawQuery.toLowerCase().replace(/[%_\\]/g, '\\$&');
const searchPattern = `%${escaped}%`;
```
And add `ESCAPE '\\'` to your LIKE clauses.

### 1.6 Storage: presign upload endpoint has no auth — anyone can fill your R2 bucket

**File:** `apps/api/src/storage/storage.controller.ts` — `presign()`

The upload presign endpoint only checks origin and rate limit (10/min per IP). An attacker can generate presigned URLs and upload 100MB files at 10/min = 1GB/min to your R2 bucket. The rate limit is per-IP and trivially bypassable with proxies.

**Fix options (pick one):**
- Require Turnstile verification on the presign endpoint (same as case creation)
- Add a global daily upload quota tracked in Redis
- Add a per-IP daily upload size quota (e.g., 500MB/day)

### 1.7 Frontend: Admin token stored in cookie without `httpOnly` flag

**File:** `apps/web/components/admin/token-sync.tsx` (sets cookie from client JS)

The admin JWT is set via client-side JavaScript into a cookie, which means it cannot be `httpOnly`. Any XSS vulnerability gives an attacker the admin token. Combined with the no-op logout (1.2), this is a persistent admin account takeover vector.

**Fix:** Move token exchange to a Next.js API route (`/api/admin/session`). The API route receives the code, exchanges it server-side, and sets the cookie with `httpOnly: true, secure: true, sameSite: 'lax'`. The client never touches the raw JWT.

---

## 2. HIGH Issues (Should Fix Before Launch)

### 2.1 Rate limit bypass via `X-Forwarded-For` spoofing

**File:** `apps/api/src/common/request-identifier.ts`

When `TRUST_PROXY_HEADERS=true`, the identifier comes from `X-Forwarded-For` which can be spoofed. Each spoofed IP gets its own rate limit bucket.

**Fix:** On Vercel, use `x-vercel-forwarded-for` or `x-real-ip` which are set by the platform and cannot be spoofed. Add a `TRUSTED_PROXY_HEADER` env var and default to `x-vercel-forwarded-for` in production.

### 2.2 Missing `amount` upper bound validation

**File:** `apps/api/src/cases/dto/create-case.dto.ts`

`amount` has `@Min(0)` but no `@Max()`. A malicious user could submit `amount: Number.MAX_SAFE_INTEGER` which would corrupt the `totalScamAmount` aggregation and display absurd numbers on the homepage stats.

**Fix:** Add `@Max(100_000_000_000)` (100 billion VND) or similar reasonable upper bound.

### 2.3 `getCaseById` updates even when nothing changes

**File:** `apps/api/src/cases/cases.service.ts` — `getCaseById()`

When `canCountView` is false, you still run `prisma.scamCase.update` with an empty `data: {}`. This generates a write query and updates `updatedAt` on every view, even when the view count doesn't change.

**Fix:** Only run the update when `canCountView` is true:
```typescript
const result = canCountView
  ? await this.prisma.scamCase.update({ where: { id: found.id }, data: { viewCount: { increment: 1 } }, include: {...} })
  : await this.prisma.scamCase.findUnique({ where: { id: found.id }, include: {...} });
```

### 2.4 `rebuildProfileAndStats` runs too many queries in transaction

**File:** `apps/api/src/admin/admin.service.ts` — `rebuildProfileAndStats()`

Each approve/reject triggers: findMany + deleteMany/upsert + updateMany + 5 count/aggregate queries + upsert. That's 8+ queries inside a transaction against Turso (SQLite over HTTP). Turso transactions have higher latency than local SQLite.

**Fix:** Consider debouncing stats refresh. Use `syncSystemStats` as an async background job rather than blocking the approve/reject response. At minimum, batch the count queries using a single raw SQL query.

### 2.5 Frontend: `api.ts` error parsing misses the `error` field

**File:** `apps/web/lib/api.ts` — `apiRequest()`

Your backend returns `{ success: false, error: "message" }` from `AllExceptionsFilter`, but `apiRequest` looks for `payload.message`, not `payload.error`. Users will see generic "HTTP 400" instead of the actual Vietnamese error messages.

**Fix:**
```typescript
const errorField = (payload as { error?: unknown }).error;
const messageField = (payload as { message?: unknown }).message;
const raw = errorField ?? messageField;
```

### 2.6 CSP `script-src` missing `'unsafe-inline'` for Next.js

**File:** `apps/web/next.config.ts`

Your CSP has `script-src 'self' https://challenges.cloudflare.com` but Next.js injects inline scripts for hydration. This will break in production.

**Fix:** Use nonce-based CSP with Next.js. See Next.js docs on `nonce` support in App Router. Alternatively, add `'unsafe-inline'` as a pragmatic short-term fix (less secure but functional).

### 2.7 `bankIdentifier` minimum length of 6 is too short for Vietnamese bank accounts

**File:** `apps/api/src/cases/dto/create-case.dto.ts`

Vietnamese bank account numbers are typically 10–19 digits. A minimum of 6 allows partial account numbers that are too vague to be useful and could match innocent accounts.

**Fix:** Increase to `@MinLength(8)` and add a regex pattern validation for digits only: `@Matches(/^\d{8,20}$/)`.

### 2.8 No pagination on admin `listCases` — all pending cases loaded at once

**File:** `apps/web/app/(admin)/admin/page.tsx`

The dashboard loads ALL pending cases via `listAdminCases(token, CaseStatus.PENDING)` without pagination. If 500 reports come in, this page will timeout or crash.

**Fix:** Add pagination controls to the admin cases list, matching the pattern used in the public search page.

---

## 3. MEDIUM Issues

### 3.1 Backend

| Issue | File | Fix |
|-------|------|-----|
| `hashSalt` defaults to `"skam-salt"` — weak in dev-to-prod leaks | `cases.service.ts` | Make `REQUIRE_HASH_SALT=true` in production env check |
| Telegram notification blocks case creation response | `cases.service.ts` | Move `notifyNewCase` after returning response (fire-and-forget) |
| `updateManyAndReturn` is Prisma 7 specific — verify Turso adapter support | `admin.service.ts` | Test this specific query against Turso before deploy |
| No `@IsInt()` on `amount` — allows `1.23456789012` (float precision) | `create-case.dto.ts` | Keep `@IsNumber()` but add `@Max(2)` decimal places check |
| `searchBanks` query param `q` has no MinLength — empty string triggers unfiltered list | `banks.controller.ts` | Add minimum length or return cached full list explicitly |
| `HealthController` has no rate limiting | `health.controller.ts` | Add rate limit (health endpoints are DDoS targets) |
| Missing `onDelete` cascade on `ScammerProfile.cases` | `schema.prisma` | Profile deletion leaves orphaned cases with dangling `profileId` |

### 3.2 Frontend

| Issue | File | Fix |
|-------|------|-----|
| Both fonts applied to `<body>` — JetBrains Mono class overrides Inter | `layout.tsx` | Use CSS variable approach: `--font-sans` and `--font-mono` |
| `reportCount` prop shows `viewCount` with label "báo cáo" — misleading | `page.tsx`, `result-card.tsx` | Rename to "lượt xem" or compute actual report count |
| Evidence URLs fetched server-side for each case view — N+1 problem | `case/[id]/page.tsx` | Batch evidence URL fetching or lazy-load on client |
| No error handling in `onUploadFiles` for individual file failures | `report/page.tsx` | Wrap each file upload in try/catch, show partial success |
| Turnstile script loaded without cleanup safety | `report/page.tsx` | Check if widget already rendered before re-rendering |
| `GlassCard` uses `var(--border-neon)` which is not defined in globals.css | `glass-card.tsx` | Add `--border-neon` to `:root` or use existing variable |
| `SearchForm` uses native form `action="/search"` — no loading feedback on slow networks | `search-form.tsx` | Use `useRouter().push()` for client-side navigation with loading state |
| Admin token sync might run before cookie API route exists | `token-sync.tsx` | Verify the session route handler exists and works |

### 3.3 Design System Compliance

| Issue | Location | Fix |
|-------|----------|-----|
| `Card` component duplicates `GlassCard` styling — inconsistent usage | Components | Unify: `Card` should extend or replace `GlassCard` |
| Case detail page uses `Card`, search uses `GlassCard` — visual inconsistency | Public pages | Pick one. Recommend `GlassCard` for public, `Card` for admin |
| Profile page has no loading state or error boundary | `profile/[identifier]/page.tsx` | Add Suspense boundary or loading.tsx in route |
| Navbar has no mobile responsive handling | `nav-bar.tsx` | Add hamburger menu or responsive nav |
| No favicon or app icon defined | `layout.tsx` | Add favicon.ico and apple-touch-icon |
| `text-glow` class used in homepage but not on other pages — inconsistent emphasis | Various | Define when glow effects should be used in design system |
| Missing `aria-label` on icon-only nav items | `nav-bar.tsx` | Add accessible labels |

---

## 4. Performance Concerns

### 4.1 Search query runs two raw SQL queries + findMany — 3 round trips to Turso

The search does: raw query for IDs → raw query for count → `findMany` with `{ in: ids }`. Over Turso (HTTP-based SQLite), each round trip adds ~50-100ms. That's 150-300ms minimum latency for search.

**Fix:** Combine the ID query and count into a single CTE query. Or better, return full data from the raw query instead of doing a second `findMany`.

### 4.2 Bank list API has no HTTP cache headers

The `GET /api/v1/banks` endpoint serves the same data for 24 hours but returns no `Cache-Control` header. Every page load fetches it fresh.

**Fix:** Add `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` to the banks response.

### 4.3 Homepage makes 2 API calls server-side with no parallel optimization

`getSummary()` and `getRecentCases()` are called sequentially with individual `.catch()`. They should be parallelized.

**Fix:** Use `Promise.all([getSummary(), getRecentCases(1, 6)])`.

### 4.4 No database connection pooling strategy for Turso

Turso's libSQL adapter opens a new HTTP connection per query by default. Under load, this creates connection storms.

**Fix:** Configure connection pooling in the Turso adapter or use their embedded replica feature for read-heavy queries.

---

## 5. Security Audit Summary

### What's Good (Strengths)

- **Helmet** applied globally — sets security headers automatically
- **CORS** properly configured with env-based origins
- **ValidationPipe** with `whitelist: true, forbidNonWhitelisted: true` — strips unknown fields
- **Rate limiting** on every public endpoint via Redis fixed-window
- **Origin checking** on write endpoints (`assertAllowedWriteOrigin`)
- **PII hashing** — submitter IP and fingerprint are SHA-256 hashed with salt
- **CSP headers** defined in Next.js config
- **Turnstile** for bot prevention on submissions
- **Admin whitelist** — only specific GitHub usernames can access admin
- **Evidence files** — content type + extension validation, file hash deduplication
- **HTML escaping** in Telegram notifications

### What Needs Work

- JWT has no `jti` claim — can't be revoked (see 1.2)
- Admin cookie is not `httpOnly` (see 1.7)
- No CSRF protection on Server Actions (Next.js handles some, but verify)
- `NEXTAUTH_SECRET` used as JWT signing key — this is fine but the name is misleading (you're not using NextAuth)
- `R2_SECRET_ACCESS_KEY` should be in a secrets manager, not plain env vars
- No request body size limit configured — large payloads could crash the server
- `originalDescription` max 5000 chars but no HTML/script sanitization — stored XSS risk if ever rendered as HTML

---

## 6. Design System Token Audit

### Defined but Unused Tokens

These CSS custom properties are defined in `globals.css` but never referenced in any component:

- `--surface-base` (used only in `body` background)
- `--surface-4`
- `--status-info` / `--status-info-bg`
- `--shadow-lg` (referenced in `.hover-lift` but not directly by components)
- `--ease-in`

### Used but Undefined

- `--border-neon` — referenced in `GlassCard` neon variant and homepage icon, but not in `:root`

### Inconsistencies

- `GlassCard` and `Card` serve the same purpose with slightly different implementations
- `--neon-green: #00ff80` in CSS vs `#00FF7F` in your architecture doc — these are different colors
- Button `variant="default"` uses `bg-primary` (neon green) which makes it identical to `variant="neon"` visually

### Recommendations

1. Add `--border-neon: hsl(150 100% 50% / 0.2)` to `:root`
2. Merge `Card` into `GlassCard` as a variant
3. Reconcile the green hex values across docs and code
4. Remove unused tokens to reduce CSS complexity

---

## 7. Deployment Readiness Checklist

| Item | Status | Notes |
|------|--------|-------|
| Environment validation on startup | ✅ | `assertProductionEnv()` checks all required vars |
| Health check endpoint | ✅ | `/api/v1/health` and `/api/v1/health/ready` |
| Database migrations | ⚠️ | Verify `prisma migrate deploy` works with Turso in CI |
| CORS configuration | ⚠️ | Missing `credentials: true` |
| Rate limiting in production | ⚠️ | `CACHE_LIMIT_FAIL_OPEN=false` must be set |
| Error handling | ✅ | Global exception filter with Vietnamese messages |
| Logging | ⚠️ | Uses NestJS Logger but no structured logging for production |
| Monitoring | ❌ | No APM, error tracking (Sentry), or metrics |
| CI/CD pipeline | ❌ | No GitHub Actions or deployment automation visible |
| SSL/TLS | ✅ | HSTS header configured, Vercel handles TLS |
| Secrets management | ⚠️ | Plain env vars — acceptable for MVP, use Vercel encrypted env |
| Backup strategy | ❌ | No Turso backup/restore plan documented |
| SEO | ✅ | robots.ts, sitemap.ts, OpenGraph metadata all present |
| PWA | ⚠️ | manifest.ts exists but no service worker |

---

## 8. Priority Action Plan

### Day 1: Critical Security
1. Fix admin token to use httpOnly cookie (1.7)
2. Implement JWT revocation/denylist (1.2)
3. Add CORS credentials (1.3)
4. Fix LIKE wildcard injection (1.5)

### Day 2: Auth & Data Integrity
5. Remove in-memory login codes (1.1)
6. Fix compound unique on ScammerProfile (1.4)
7. Add upload quota/protection (1.6)
8. Fix `apiRequest` error field parsing (2.5)

### Day 3: Performance & UX
9. Fix CSP for Next.js (2.6)
10. Fix font application in layout (3.2)
11. Parallelize homepage API calls (4.3)
12. Optimize search query to reduce Turso round trips (4.1)

### Day 4: Polish & Deploy
13. Fix `amount` validation bounds (2.2)
14. Fix `bankIdentifier` validation (2.7)
15. Add admin pagination (2.8)
16. Unify Card/GlassCard components (3.3)
17. Add monitoring/Sentry (Deployment checklist)

---

*End of review. Questions or need implementation details for any fix? Let me know.*
