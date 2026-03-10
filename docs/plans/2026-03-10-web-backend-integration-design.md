# Plan: Production Web + API Integration

## Goals
- Complete public and admin web flows with full API integration.
- Align implementation with SKAM design/system rules and platform security rules.
- Ship production-ready UX for mobile and desktop, not MVP shortcuts.

## Phase 1 — API Contract Hardening
- Add `GET /cases/recent` for homepage recent approved cases.
- Add missing pagination DTO for reusable list endpoints.
- Add consistent request-level rate limits for search/detail/profile/summary routes.
- Fix web admin auth typing mismatch for `/auth/me`.

## Phase 2 — Public Experience Completion
- Replace homepage fake counters with `/analytics/summary`.
- Render recent approved case list on homepage with direct links.
- Add search page filters and pagination controls wired to URL params.
- Upgrade case detail evidence rendering via approved-only signed URL endpoint.

## Phase 3 — Report Flow Completion
- Restructure report form into clear step sections.
- Add dynamic social links collection and submit to backend.
- Keep direct-to-R2 upload flow with hash dedupe and strict file constraints.
- Require Turnstile token when site key is configured.

## Phase 4 — Admin Experience Completion
- Keep admin entry hidden from public UI.
- Keep route-gating with `proxy.ts` and server-side cookie auth checks.
- Expand admin list UX with status filters and responsive controls.
- Keep analytics cards and top-reported list fed by live API.

## Phase 5 — Security and Headers
- Keep HttpOnly strict cookie session sync route.
- Add/maintain security headers in Next config.
- Keep whitelist-based GitHub authorization in backend guard path.
- Ensure no secrets or tokens are exposed in rendered HTML or logs.

## Phase 6 — Production Verification
- Run `apps/api`: typecheck, e2e, build.
- Run `apps/web`: typecheck, build.
- Resolve diagnostics and compile warnings.

## File Change Plan
- `apps/api/src/cases/dto/paginate-case.dto.ts`
- `apps/api/src/cases/cases.controller.ts`
- `apps/api/src/cases/cases.service.ts`
- `apps/api/src/profiles/profiles.controller.ts`
- `apps/api/src/analytics/analytics.controller.ts`
- `apps/web/lib/api.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/(public)/search/page.tsx`
- `apps/web/app/(public)/report/page.tsx`
- `apps/web/next.config.ts`

## Verification Plan
- API: `bun run --cwd apps/api typecheck && bun run --cwd apps/api test:e2e && bun run --cwd apps/api build`
- Web: `bun run --cwd apps/web typecheck && bun run --cwd apps/web build`
- IDE diagnostics: zero errors.
