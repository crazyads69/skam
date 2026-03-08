# Backend-First Execution Plan

## Goal
Establish a production-oriented backend foundation for SKAM based on the full documentation, with validated scope, current-state gaps, and a verified first implementation slice.

## Phases
1. Complete — Audit current codebase and documentation alignment
2. Complete — Research up-to-date dependency/library docs
3. Complete — Produce detailed backend-first step-by-step plan
4. Complete — Implement prioritized backend milestones
5. Complete — Run full verification and summarize deltas

## Detailed Step-by-Step Plan

### Full Backend Completion Plan
1. Complete domain schema and persistence
   - Add missing Prisma entities for evidence files and social links.
   - Add indexes and relation paths required by search, moderation, and profile aggregation.
   - Regenerate Prisma client and create migration.
2. Implement auth and admin security flow
   - Add GitHub OAuth endpoints and callback flow.
   - Add backend JWT issue/verify utilities and admin whitelist enforcement.
   - Protect admin endpoints with guard + shared request principal shape.
3. Implement admin moderation workflow
   - Add list/filter cases endpoint for admins.
   - Add approve/reject/refine/delete endpoints.
   - Update profile aggregates and system stats on state transitions.
4. Implement banks and storage workflows
   - Add banks listing/search endpoints with cache-first behavior.
   - Add upload presign endpoint for R2-compatible S3 flow with file validation.
   - Persist and validate evidence metadata lifecycle.
5. Harden production runtime security
   - Add security headers middleware.
   - Centralize environment parsing and runtime validation.
   - Standardize API error handling and rate limiting policies.
6. Close quality and production-readiness gaps
   - Add integration/e2e tests for public + admin flows.
   - Remove placeholder lint/test paths where feasible.
   - Verify build, typecheck, tests, migrations, and representative API smoke checks.

### Phase 3 — Final Planning (current)
1. Define MVP backend milestone boundary for this iteration:
   - Keep existing Health and Cases.
   - Add persistent Prisma-backed cases.
   - Add foundational modules required for backend-first progress: Database, Cache (skeleton), Turnstile (verification), and minimal public endpoints required to unblock frontend integration.
2. Confirm data model scope for first slice:
   - Expand Prisma schema from minimal `ScamCase` to include moderation fields and core relational entities needed soonest (`ScammerProfile`, `SystemStats`).
   - Defer heavy media entities (`EvidenceFile`, `SocialLink`) if they slow first backend release.
3. Define endpoint priority:
   - P0: `GET /health`, `POST /cases`, `GET /cases/search`, `GET /cases/:id`
   - P1: `GET /analytics/summary`, `GET /profiles/:identifier`
   - P2: admin/auth/upload/banks.

### Phase 4 — Implementation
1. Refactor backend architecture
   - Create `database/` module with `PrismaService` supporting local SQLite and Turso libSQL adapter.
   - Wire `DatabaseModule` globally in `AppModule`.
2. Migrate Cases from in-memory to Prisma
   - Rewrite `CasesService` with Prisma queries and pagination-ready search.
   - Add DTO for pagination constraints.
   - Add `GET /cases/:id` endpoint with approved-only behavior.
3. Add Profiles and Analytics minimal modules
   - Create profile read endpoint by `bankIdentifier`.
   - Create summary endpoint from `SystemStats` with fallback aggregation.
4. Add security and anti-abuse foundation
   - Add Turnstile service and verify token in case submission flow.
   - Add Redis-backed rate limit service using Upstash REST primitives; enforce submission/search limits.
5. Update configuration and environment templates
   - Add missing dependencies and scripts (`prisma:generate`).
   - Add `.env.example` with required keys, remove reliance on committed `.env`.
6. Add automated tests
   - Unit tests for CasesService happy/error paths.
   - Integration tests for core public endpoints response shape and status.

### Phase 5 — Verification
1. Run workspace checks: lint, typecheck, tests, build.
2. Run Prisma migration and verify schema/table shape.
3. Start backend and validate key endpoints with HTTP checks.
4. Record what was implemented vs still pending from full documentation.

## Assumptions
- Existing monorepo scaffold is valid and can be refactored.
- Backend-first means API + data layer + contracts before broad frontend work.

## Risks
- Documentation scope may exceed one iteration.
- Existing scaffold may diverge from required architecture patterns.

## Validation Targets
- Workspace lint/typecheck/test/build pass
- Backend endpoints run locally and return expected payloads
- Prisma schema and migrations are aligned with backend domain model
