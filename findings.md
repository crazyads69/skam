# Findings Log

## Scope
- Captures concrete discoveries from documentation, codebase survey, and library research.

## Current Findings
- Documentation has full backend architecture target: Database, Cache, Storage, Turnstile, Auth, Cases, Profiles, Admin, Analytics, Banks modules.
- Current backend implements only Health + Cases modules with two endpoints (`POST /cases`, `GET /cases/search`) plus health.
- Current `CasesService` is in-memory and not Prisma-backed; this is the biggest backend-first gap.
- Prisma v7 requires datasource URL in `prisma.config.ts`; current repo already follows this baseline.
- Prisma schema is currently minimal (`ScamCase`, `CaseStatus`) and missing `ScammerProfile`, `EvidenceFile`, `SocialLink`, `SystemStats`, and additional case moderation fields.
- Up-to-date NestJS guidance confirms global `ValidationPipe` with `transform` + `whitelist`; current bootstrap is aligned and should add `forbidNonWhitelisted`.
- Up-to-date NestJS guidance for throttling recommends `@nestjs/throttler` module + global guard with route overrides.
- Up-to-date Upstash guidance supports Redis REST via `Redis.fromEnv()` with fixed-window counters using `INCR` + `EXPIRE`.
- Up-to-date Turnstile guidance requires server-side POST to `/turnstile/v0/siteverify` with `secret`, `response`, optional `remoteip`.
- Shared package interfaces are reusable in backend, but with current API tsconfig module resolution, stable imports should use `@skam/shared/src/types` instead of `@skam/shared/types`.
- Prisma v7 + `prisma-client` generator output into app source avoids missing `PrismaClient` type issues in this workspace.
- Implemented rate-limit foundation via Upstash fixed-window counter and case submission limit.
- NestJS passport docs confirm guard pattern `AuthGuard('jwt')` and strategy-based JWT validation.
- NestJS security docs confirm applying `helmet` globally before route registrations.
- AWS SDK v3 docs confirm `getSignedUrl` with `PutObjectCommand` + `expiresIn` for presigned upload URLs.
- JOSE docs confirm symmetric `jwtVerify` with `TextEncoder` secret for HS256 token verification.
- Upstash guidance recommends `@upstash/ratelimit` for production policy enforcement beyond manual `INCR`/`EXPIRE`.
- NestJS testing docs confirm E2E shape with `Test.createTestingModule()` + `supertest` for endpoint contracts.
- Runtime note: current workspace package export strategy is Bun-friendly; production startup is stable using `bun dist/main.js` for API process.
- Admin whitelist is strict by design: if `ADMIN_WHITELIST` is empty, all admin-protected endpoints reject access.
- Search endpoint intentionally returns only approved cases; newly submitted cases remain hidden until moderation approval.
