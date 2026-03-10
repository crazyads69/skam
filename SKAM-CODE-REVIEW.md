# SKAM Code Review — March 2026

## Overall Assessment

The codebase is well-architected for an MVP. The monorepo structure is clean, backend module separation follows NestJS best practices, shared types enforce contract consistency, and the design system is cohesive. The privacy-first architecture (hashed IPs, no account holder names stored) is well-executed.

That said, there are several concrete bugs, security gaps, and architecture improvements that should be addressed before production launch.

---

## Critical Bugs

### 1. `PublicViewUrlDto` uses `@IsUUID()` but IDs are CUIDs

In `apps/api/src/storage/dto/public-view-url.dto.ts`, both `caseId` and `evidenceId` are validated with `@IsUUID()`. However, the Prisma schema uses `@default(cuid())` for all IDs. CUIDs are **not** UUIDs — every valid request will fail validation.

**Fix:** Replace `@IsUUID()` with `@IsString() @MinLength(10) @MaxLength(40)`.

### 2. Misleading rate-limit variable name in `CasesService.createCase`

```ts
const isLimited: boolean = await this.cache.fixedWindowLimit(...)
if (!isLimited) throw new HttpException('...', 429)
```

`fixedWindowLimit` returns `true` when the request is **allowed** (under the limit). The variable `isLimited` reads as "is the user rate-limited" but actually means "is the user allowed." The code works correctly but is a maintenance trap.

**Fix:** Rename to `const isAllowed = await ...` or `const withinLimit = await ...`.

### 3. `proxy.ts` is not recognized by Next.js

The file `apps/web/proxy.ts` implements Next.js middleware but is not named `middleware.ts`. Next.js requires the file to be at `apps/web/middleware.ts` for automatic route-matching. Currently, admin route protection at the edge is **not active**.

**Fix:** Rename `proxy.ts` to `middleware.ts`.

### 4. Search is case-sensitive on SQLite

In `CasesService.searchCases`, the query uses `contains` on `bankIdentifier` and `scammerName`. On SQLite (and Turso/libSQL), `contains` maps to `LIKE '%...%'` which is case-sensitive by default. A search for "nguyen" won't match "NGUYEN VAN A".

**Fix:** Either normalize `bankIdentifier` to uppercase on insert (already done for `bankCode`), or use `mode: 'insensitive'` if supported, or apply `.toLowerCase()` to search input AND store lowercased values in a separate indexed column for search.

---

## Security Issues

### 5. JWT token exposed in URL fragment

In `auth.controller.ts`, after GitHub OAuth callback:
```ts
response.redirect(`${webBase}/admin/login#token=${encodeURIComponent(token)}`)
```

While URL fragments (`#`) are not sent to servers in HTTP requests, they can:
- Appear in browser history
- Be logged by browser extensions
- Be captured by malicious JavaScript on the page
- Persist in the URL bar if the user doesn't navigate away

**Fix:** Use a short-lived authorization code pattern instead. Redirect with a temporary code as a query param, then exchange it for the JWT via a server-side API call, storing the JWT in an HttpOnly cookie only.

### 6. No CSRF protection on state-changing endpoints

The API has no CSRF tokens or SameSite cookie enforcement. The admin endpoints use Bearer tokens (which are CSRF-safe), but the public `POST /cases` endpoint relies only on Turnstile (which is optional). An attacker could craft a form on another site to auto-submit scam reports.

**Fix:** Make Turnstile mandatory in production (`TURNSTILE_ALLOW_BYPASS=false`), or add a CSRF token mechanism for the report form.

### 7. View count increment is unbounded per user per case

`getCaseById` increments `viewCount` on every request. A single user refreshing the page 100 times inflates the count by 100. There's a global rate limit per user across all cases, but no deduplication per case.

**Fix:** Use Redis to track `view:case:{caseId}:{ipHash}` with a short TTL (e.g., 1 hour) and only increment if the key doesn't exist.

### 8. Admin whitelist is static at startup

`ADMIN_WHITELIST` is parsed once at module load time in `admin-whitelist.ts`. Changing the whitelist requires a full restart. In a serverless deployment (Vercel), this is less of an issue since cold starts re-read env vars, but in a persistent process it's a gap.

**Fix:** Read `process.env.ADMIN_WHITELIST` fresh inside `assertAdmin()` or at the `AdminGuard` level per request (with a short TTL cache).

---

## Architecture Improvements

### 9. Duplicated `mapCase()` in `CasesService` and `AdminService`

Both services have nearly identical `mapCase()` methods (~80 lines each) that convert Prisma records to the `ScamCase` shared type. This is a DRY violation.

**Fix:** Extract into a shared utility, e.g., `apps/api/src/common/case-mapper.ts`, and import from both services.

### 10. S3 client created per request in `StorageService`

Both `presignUpload` and `presignViewUrl` instantiate a new `S3Client` on every call. The AWS SDK v3 client is designed to be reused.

**Fix:** Create the S3 client once in the constructor (or lazily on first use) and reuse it.

### 11. No global exception filter

Raw NestJS error responses may leak internal details (stack traces, Prisma error codes) to clients. There's no `AllExceptionsFilter` to normalize error responses.

**Fix:** Add a global exception filter that catches all errors and returns a consistent `{ success: false, error: "..." }` shape, logging the full error internally while sending only safe messages to clients.

### 12. No transaction wrapping for admin approve flow

In `AdminService.approveCase`, the profile upsert and system stats update happen as separate queries. If the process crashes between them, you'll have inconsistent state (case approved but profile stats not updated).

**Fix:** Wrap the approve/reject flows in `this.prisma.$transaction([...])` to ensure atomicity.

### 13. `AnalyticsService.getSummary` fallback does 5 separate queries

When `SystemStats` doesn't exist, the service fires 5 parallel queries. This is fine for bootstrapping but means the first analytics request on a fresh database is expensive.

**Fix:** After computing the fallback, write the result back to `SystemStats` so subsequent requests hit the fast path.

---

## Frontend Improvements

### 14. All API calls use `cache: "no-store"`

Every `apiRequest` call disables caching entirely. The homepage could benefit from ISR (Incremental Static Regeneration) or time-based revalidation for the summary stats and recent cases.

**Fix:** For public read-only endpoints (`/analytics/summary`, `/cases/recent`), use `next: { revalidate: 60 }` instead of `cache: "no-store"`. Keep `no-store` for admin and write operations.

### 15. Report page is a monolithic component (~400 lines)

The report page (`apps/web/app/(public)/report/page.tsx`) handles form state, validation, file uploads, social links, bank selection, and submission in a single client component.

**Fix:** Break into composable components: `BankSelector`, `SocialLinksEditor`, `EvidenceUploader`, `ReportFormSummary`. Each manages its own state and exposes values via React Hook Form's `useFormContext`.

### 16. Missing loading/error states for client-side interactions

The search form, report submission, and admin actions don't show intermediate loading states. Users get no feedback between clicking "Submit" and receiving a response.

**Fix:** Add `isSubmitting` state from React Hook Form's `formState` to disable buttons and show spinners during API calls.

### 17. No client-side input sanitization

While the backend validates inputs, the frontend sends raw user input. Vietnamese users may accidentally include zero-width characters, smart quotes, or trailing whitespace that could affect search.

**Fix:** Trim and normalize inputs on the frontend before submission.

---

## Code Quality

### 18. Inconsistent error messages (mixed Vietnamese/English)

Most user-facing error messages are in Vietnamese (good), but the Telegram notification template uses English ("New scam case submitted"). Admin error messages are also mixed.

**Fix:** Decide on language conventions: Vietnamese for user-facing UI, English for internal/developer messages and logs.

### 19. No enum validation for `SocialPlatform` in `CreateSocialLinkDto`

The `platform` field on `CreateSocialLinkDto` is validated as `@IsString()` but should be validated against the `SocialPlatform` enum to reject invalid platforms like `"WHATSAPP"`.

**Fix:** Use `@IsEnum(SocialPlatform)` from `class-validator`.

### 20. `formatMoneyVnd` returns "Không rõ" for null amounts

This is fine for display, but `formatMoneyVnd(0)` returns "0" with no "VND" suffix, while the homepage uses a different formatter with "VND" appended. Inconsistent formatting.

**Fix:** Standardize on the shared `formatVND()` utility from `@skam/shared/utils/format`.

### 21. Missing `BANK_CODES` completeness

`packages/shared/src/constants/banks.ts` has only 6 bank codes (`VCB, TCB, MB, ACB, BIDV, VPB`), but the VietQR API returns 50+ banks. The `BANK_CODES` constant isn't actually used for validation anywhere — it's dead code.

**Fix:** Either remove `BANK_CODES` or make it the actual validation source and keep it in sync with VietQR data.

---

## Production Readiness Checklist

| Item | Status | Priority |
|------|--------|----------|
| Fix CUID vs UUID validation bug | Not done | **Critical** |
| Rename `proxy.ts` to `middleware.ts` | Not done | **Critical** |
| Fix case-sensitive search | Not done | **High** |
| Add global exception filter | Not done | **High** |
| Wrap admin flows in transactions | Not done | **High** |
| Move token from URL hash to HttpOnly cookie | Not done | **High** |
| Reuse S3 client instance | Not done | **Medium** |
| Extract shared `mapCase()` | Not done | **Medium** |
| Add ISR caching for public pages | Not done | **Medium** |
| Deduplicate view count increments | Not done | **Medium** |
| Break up report page component | Not done | **Low** |
| Add `@IsEnum` for social platforms | Not done | **Low** |
| Standardize money formatting | Not done | **Low** |

---

## What's Working Well

- **Privacy architecture**: SHA-256 hashed IPs with configurable salt, no account holder names stored, anonymous submissions — this is solid for Vietnamese legal compliance.
- **Graceful degradation**: Cache, Turnstile, Redis, and Telegram notifications all degrade gracefully when not configured. The `limitFailOpen` pattern is well-thought-out.
- **Bank data resilience**: Three-tier caching (memory → Redis → stale Redis) with inflight deduplication is production-grade.
- **Design system**: The CSS custom property system with glassmorphism, neon accents, and proper Vietnamese typography support (Inter font, 1.6 line-height) is professional and distinctive.
- **Security headers**: Both the API (Helmet) and the frontend (CSP, HSTS, X-Frame-Options) have proper security headers.
- **Health checks**: The `/health/ready` endpoint that checks both database and cache connectivity is deployment-friendly.
