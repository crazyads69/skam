# Security Remediation Report — March 2026

## Scope

This report documents the re-evaluation and remediation work performed after reviewing `SKAM-CODE-REVIEW.md`.

## Resolved Review Items

1. CUID/UUID mismatch in public evidence DTO  
   - Updated `apps/api/src/storage/dto/public-view-url.dto.ts` to validate string IDs with length bounds.

2. Misleading rate-limit variable naming  
   - Renamed the case submit limiter variable to `isAllowed` in `apps/api/src/cases/cases.service.ts`.

3. Middleware/proxy compatibility  
   - Verified runtime behavior with Next.js 16 and kept `apps/web/proxy.ts` as canonical edge guard file.

4. Search normalization improvements  
   - Replaced variant-based matching with SQLite-safe case-insensitive query logic using `LOWER(... ) LIKE` in `apps/api/src/cases/cases.service.ts`.

5. JWT exposure in URL fragment  
   - Replaced hash-token OAuth handoff with one-time login code exchange:
     - `apps/api/src/auth/auth.controller.ts`
     - `apps/api/src/auth/auth.service.ts`
     - `apps/api/src/auth/dto/exchange-code.dto.ts`
     - `apps/web/components/admin/token-sync.tsx`
     - `apps/web/app/api/admin/session/route.ts`
     - `apps/web/lib/api.ts`

6. Turnstile production safety  
   - Enforced production startup guard to reject `TURNSTILE_ALLOW_BYPASS=true` in `apps/api/src/main.ts`.
   - Added strict write-origin enforcement for browser-submitted public write endpoints:
     - `apps/api/src/common/request-origin.ts`
     - `apps/api/src/cases/cases.controller.ts`
     - `apps/api/src/storage/storage.controller.ts`

7. View count inflation  
   - Added per-case/per-requester deduplication window in `apps/api/src/cases/cases.service.ts` and updated controller call path.

8. Static admin whitelist at startup  
   - Switched to dynamic whitelist resolution from environment per auth check in `apps/api/src/auth/auth.service.ts`.

9. Duplicate case mapping logic  
   - Extracted shared mapper `apps/api/src/common/case-mapper.ts` and reused in:
     - `apps/api/src/cases/cases.service.ts`
     - `apps/api/src/admin/admin.service.ts`

10. Recreating S3 client per request  
    - Reused a single configured S3 client in `apps/api/src/storage/storage.service.ts`.

11. Missing global exception filter  
    - Added `apps/api/src/common/all-exceptions.filter.ts` and registered it in `apps/api/src/bootstrap.ts`.

12. Non-atomic admin approve/reject/delete flows  
    - Wrapped critical admin mutations and dependent recomputations in transactions in `apps/api/src/admin/admin.service.ts`.

13. Analytics fallback inefficiency  
    - Persisted computed fallback summary with `systemStats.upsert` in `apps/api/src/analytics/analytics.service.ts`.

14. No caching strategy for public reads  
    - Added revalidation path for public summary/recent endpoints in `apps/web/lib/api.ts`.

15. Report page component complexity  
    - Split large report page UI into composable modules:
      - `apps/web/components/report/bank-selector.tsx`
      - `apps/web/components/report/social-links-editor.tsx`
      - `apps/web/components/report/evidence-uploader.tsx`
      - `apps/web/components/report/report-form-summary.tsx`
    - Updated `apps/web/app/(public)/report/page.tsx` to orchestrate form state while delegating section rendering.
   - Added submit-pending states for search/admin actions:
     - `apps/web/components/search/search-form.tsx`
     - `apps/web/components/search/search-filters.tsx`
     - `apps/web/components/ui/form-submit-button.tsx`
     - `apps/web/app/(admin)/admin/cases/[id]/page.tsx`

17. Incomplete input normalization in frontend  
    - Added `apps/web/lib/sanitize.ts` and applied normalization in:
      - `apps/web/app/(public)/search/page.tsx`
      - `apps/web/app/(public)/report/page.tsx`

19. Missing enum validation for social platform  
    - Updated DTO validation to `@IsEnum(SocialPlatform)` in `apps/api/src/cases/dto/create-case.dto.ts`.

20. Money formatting inconsistency  
    - Standardized on shared formatter via `formatVND` in `apps/web/lib/utils.ts` and removed duplicated suffixing on pages.

21. Unused/incomplete bank code constant  
    - Removed dead constant file `packages/shared/src/constants/banks.ts` and cleaned shared constants export index.

22. Mixed user-facing language consistency  
    - Localized Telegram notification message content to Vietnamese user-facing text in `apps/api/src/notifications/telegram-notifier.service.ts`.

## Additional Security Hardening

- Replaced unsafe raw SQL health query with safe tagged query in `apps/api/src/health/health.controller.ts`.
- Added `Cache-Control: no-store` to admin session create/delete responses.
- Preserved HttpOnly + SameSite strict cookie session behavior.
- Added origin/referer allowlist checks for public write endpoints to reduce CSRF-style cross-site form submissions.

## Security Audit Findings

- SQL injection risk: mitigated by avoiding unsafe query API in app code.
- XSS risk: no unsafe HTML rendering path added; CSP and strict React rendering remain in place.
- Authentication bypass risk: reduced by one-time auth code flow and dynamic whitelist checks.
- Insecure data storage risk: sensitive requester identifiers remain hashed with salt.
- Input validation gaps: closed for social platform enum and public evidence ID DTO.

## Performance and Production Readiness

- Reduced object creation overhead in storage signing flow by reusing S3 client.
- Reduced repeated analytics cold-path cost by persisting computed fallback.
- Added cache revalidation for public read endpoints to reduce origin pressure.
- Improved consistency and recoverability of admin write flows with transactions.
- Reduced search endpoint latency by parallelizing case ID page query and total count query.

## Validation

Executed and passed:

- `bun run typecheck`
- `bun run build`
- `bun run test`

No editor diagnostics remained after changes.
