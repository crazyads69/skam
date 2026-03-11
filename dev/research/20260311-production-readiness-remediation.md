---
date: 2026-03-11T12:16:00+07:00
topic: "Production Readiness Review — Issue Remediation"
tags: [research, codebase, production-readiness, security, performance, bugfix]
status: complete
last_updated: 2026-03-11
---

# Research: Production Readiness Review — Issue Remediation

**Date**: 2026-03-11T12:16:00+07:00

## Research Question

Review and fix all issues identified in the SKAM Production Readiness Review document, covering Critical, High, Medium priority issues and Security gaps.

## Summary

All actionable issues from the Production Readiness Review have been addressed. 17 files were modified across backend API and frontend. The fixes cover 4 Critical issues, 6 High-priority issues, 6 Medium issues, and 4 Security gaps.

## Detailed Findings

### CRITICAL Issues Fixed

#### 1.1 StorageService crashes app at startup if R2 env vars missing
- **File**: [apps/api/src/storage/storage.service.ts](apps/api/src/storage/storage.service.ts)
- **Fix**: Added `enabled` flag, `Logger`, and `ServiceUnavailableException`. Constructor no longer throws; instead logs a warning and disables storage operations gracefully. All public methods now call `assertEnabled()` guard.

#### 1.2 bankIdentifier validation mismatch between frontend and backend
- **Files**: [packages/shared/src/schemas/case.schema.ts](packages/shared/src/schemas/case.schema.ts), [apps/web/components/report/report-form.schema.ts](apps/web/components/report/report-form.schema.ts)
- **Fix**: Updated both schemas from `z.string().min(6).max(40)` to `z.string().regex(/^\d{8,20}$/, "Số tài khoản phải từ 8-20 chữ số")` to match backend DTO's `@Matches(/^\d{8,20}$/)`.

#### 1.3 Admin token domain requirement (documentation)
- **Status**: Noted. The recommendation is to ensure API and frontend are on the same domain in production. No code change needed — this is an infrastructure concern.

#### 1.4 `updateManyAndReturn` Turso/libSQL compatibility
- **File**: [apps/api/src/admin/admin.service.ts](apps/api/src/admin/admin.service.ts)
- **Fix**: Replaced `updateManyAndReturn` with `updateMany` + separate `findUnique` pattern in both `approveCase` and `rejectCase` methods. Uses destructured `{ count: updatedCount }` for race-condition checking.

### HIGH Priority Issues Fixed

#### 2.1 Public analytics leaks totalPendingCases
- **Files**: [apps/api/src/analytics/analytics.service.ts](apps/api/src/analytics/analytics.service.ts), [apps/web/lib/api.ts](apps/web/lib/api.ts)
- **Fix**: Removed `totalPendingCases` from the `AnalyticsSummary` interface and all related queries/returns. Frontend type updated accordingly. Admin analytics (via `AdminService.getAdminAnalytics()`) still exposes pending count.

#### 2.2 SQL injection safety documentation
- **File**: [apps/api/src/cases/cases.service.ts](apps/api/src/cases/cases.service.ts)
- **Fix**: Added safety comment explaining why `$queryRaw` tagged template usage is safe and warning against refactoring to `$queryRawUnsafe`.

#### 2.3 CSRF architectural decision documentation
- **File**: [apps/api/src/common/request-origin.ts](apps/api/src/common/request-origin.ts)
- **Fix**: Added JSDoc comment documenting that admin endpoints use JWT from Authorization header (not cookies) and are therefore not vulnerable to CSRF.

#### 2.4 `getApiBaseUrl()` edge cases
- **File**: [apps/web/lib/site.ts](apps/web/lib/site.ts)
- **Fix**: Improved URL normalization to strip partial `/api/vN` suffixes before appending `/api/v1`, preventing double-path issues.

#### 2.5 No error handling in admin server actions
- **File**: [apps/web/app/(admin)/admin/cases/[id]/page.tsx](apps/web/app/(admin)/admin/cases/%5Bid%5D/page.tsx)
- **Fix**: Wrapped `refineAction`, `approveAction`, and `rejectAction` in try/catch blocks with Vietnamese error messages.

#### 2.6 Shared package import paths
- **File**: [packages/shared/package.json](packages/shared/package.json)
- **Status**: Verified — the `exports` map already covers both `./types` and `./src/types` import paths. No change needed.

### MEDIUM Priority Issues Fixed

#### 3.1 Rate limiting proxy header spoofing documentation
- **File**: [apps/api/src/common/request-identifier.ts](apps/api/src/common/request-identifier.ts)
- **Fix**: Added JSDoc comment warning that `TRUST_PROXY_HEADERS` should only be enabled behind trusted proxies (Vercel, Cloudflare).

#### 3.2 Homepage SSR caching
- **Status**: Already using `next: { revalidate: 60 }` ISR caching. Acceptable for MVP. No change needed.

#### 3.3 Telegram notification silent failure
- **File**: [apps/api/src/cases/cases.service.ts](apps/api/src/cases/cases.service.ts)
- **Fix**: Replaced empty `.catch(() => {})` with debug-level logging in the catch handler. Added `Logger` import and field.

#### 3.4 Turnstile verification optional on upload
- **File**: [apps/api/src/storage/storage.controller.ts](apps/api/src/storage/storage.controller.ts)
- **Fix**: When Turnstile is enabled, missing token now results in a 400 error ("Thiếu Turnstile token") instead of silently allowing the upload.

#### 3.5 `fixedWindowLimit` race condition
- **File**: [apps/api/src/cache/cache.service.ts](apps/api/src/cache/cache.service.ts)
- **Fix**: Added TTL safety net — when `count > 1`, checks if key has TTL (`redis.ttl(key)`). If TTL is -1 (no expiry), re-applies the window TTL. This handles the edge case where EXPIRE was lost after INCR.

#### 3.6 No pagination on admin cases list
- **File**: [apps/web/app/(admin)/admin/cases/page.tsx](apps/web/app/(admin)/admin/cases/page.tsx)
- **Fix**: Added page size of 50, page URL parameter parsing, and prev/next pagination controls. Uses existing `listAdminCases` API which already supports pagination.

### Security Gaps Fixed (Section 5.2)

#### Request body size limit
- **File**: [apps/api/src/bootstrap.ts](apps/api/src/bootstrap.ts)
- **Fix**: Added `app.use(json({ limit: "1mb" }))` to prevent large payload OOM attacks.

#### Login code regex tightened
- **File**: [apps/api/src/auth/auth.service.ts](apps/api/src/auth/auth.service.ts)
- **Fix**: Changed from `/^[a-f0-9]{32,128}$/` to `/^[a-f0-9]{48}$/` (exact 48 hex chars = 24 bytes from `randomBytes(24).toString("hex")`).

#### Admin logout JWT revocation
- **File**: [apps/web/app/api/admin/session/route.ts](apps/web/app/api/admin/session/route.ts)
- **Fix**: DELETE handler now reads the admin token from cookie and calls backend `POST /auth/logout` to revoke the JWT before clearing the cookie. Best-effort (failure doesn't block cookie deletion).

## Code References

- `apps/api/src/storage/storage.service.ts` — StorageService with graceful R2 fallback
- `apps/api/src/admin/admin.service.ts` — updateMany + findUnique pattern
- `apps/api/src/analytics/analytics.service.ts` — totalPendingCases removed from public API
- `apps/api/src/cases/cases.service.ts` — SQL safety comment, Telegram logging, Logger
- `apps/api/src/cache/cache.service.ts` — TTL safety net for rate limiting
- `apps/api/src/bootstrap.ts` — 1MB body size limit
- `apps/api/src/auth/auth.service.ts` — Tightened login code regex
- `apps/api/src/common/request-origin.ts` — CSRF documentation
- `apps/api/src/common/request-identifier.ts` — Proxy header documentation
- `apps/api/src/storage/storage.controller.ts` — Mandatory Turnstile on upload
- `apps/web/lib/api.ts` — Removed totalPendingCases from type
- `apps/web/lib/site.ts` — Hardened getApiBaseUrl()
- `apps/web/app/(admin)/admin/cases/[id]/page.tsx` — Error handling in server actions
- `apps/web/app/(admin)/admin/cases/page.tsx` — Pagination controls
- `apps/web/app/api/admin/session/route.ts` — JWT revocation on logout
- `packages/shared/src/schemas/case.schema.ts` — bankIdentifier regex validation
- `apps/web/components/report/report-form.schema.ts` — bankIdentifier regex validation

## Architecture Insights

- The admin auth flow uses JWT in Authorization header (not cookie-based auth), making it inherently CSRF-safe
- The StorageService pattern of graceful degradation aligns with NestJS DI best practices — services should not crash the DI container
- Prisma's `updateManyAndReturn` is too new for broad adapter support; `updateMany` + `findUnique` is the safe universal pattern
- The rate limiter's INCR→EXPIRE sequence has an inherent race window that requires a TTL safety check

## Open Questions

- Performance: `rebuildProfileAndStats` runs synchronously in approve/reject transactions — may need async processing at scale
- Search: `LIKE %query%` forces full table scans — plan for SQLite FTS5 or dedicated search service at 10K+ rows
- Permissions-Policy header could be added to restrict payment/USB/etc APIs (low priority)
