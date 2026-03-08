# SKAM PLATFORM — Full System Documentation

> **Anti-Fraud Banking Verification Platform for Vietnam**
> *"Truecaller for Bank Accounts"*
>
> Version 2.0 | March 2026
> Product Owner: Trí | Cake Digital Bank

---

# TABLE OF CONTENTS

**PART A — PROJECT OVERVIEW**
1. Executive Summary
2. Tech Stack & Versions
3. System Architecture
4. Infrastructure & Deployment

**PART B — MONOREPO SETUP (Bun Workspaces)**
5. Monorepo Structure
6. Bun Workspace Configuration
7. Shared Packages
8. Scripts & Commands

**PART C — BACKEND DOCUMENTATION (NestJS)**
9. Backend Project Structure
10. Database Schema (Prisma + Turso)
11. NestJS Modules Breakdown
12. API Endpoints Reference
13. Authentication & Authorization
14. Caching Strategy (Upstash Redis)
15. File Storage (Cloudflare R2)
16. Security & Rate Limiting

**PART D — FRONTEND DOCUMENTATION (Next.js)**
17. Frontend Project Structure
18. Pages & Routing
19. Components Library
20. State Management & Data Fetching

**PART E — DESIGN SYSTEM (Dark + Neon Green)**
21. Design Philosophy & Brand Identity
22. Color System
23. Typography
24. Spacing & Layout Grid
25. Component Specifications
26. Page Templates & Patterns
27. Motion & Animation
28. Accessibility
29. Vietnamese-Specific Guidelines

**PART F — DEVELOPMENT INSTRUCTION RULES**
30. Code Standards & Conventions
31. Git Workflow & Branch Strategy
32. Environment Configuration
33. Testing Strategy
34. Deployment Pipeline
35. Security Checklist
36. Performance Guidelines

---

# PART A — PROJECT OVERVIEW

---

## 1. Executive Summary

SKAM is a community-driven anti-fraud banking platform for Vietnam that functions as a "Truecaller for bank accounts." The platform addresses a critical gap where Vietnamese citizens lose significant money annually to banking scams, yet end users have no way to verify suspicious accounts before transferring money. The State Bank of Vietnam's SIMO system only serves financial institutions, leaving regular users unprotected.

**Core Value Proposition:**

- **Anonymous search** — Users can look up any bank account to check if it has been reported
- **Anonymous reporting** — Victims can submit scam cases without creating an account
- **Admin curation** — Reports are reviewed and refined before being published
- **Privacy-first** — No personal data collected; hashing protects submitter identity
- **Mobile-optimized** — Built for Vietnam's device landscape and connectivity

**Key Metrics for Success:**

- Community adoption rate (unique daily searches)
- Report submission volume and approval rate
- Scam prevention effectiveness (user feedback)
- Platform trust score (community engagement)

---

## 2. Tech Stack & Versions

All dependencies pinned to latest stable versions as of March 2026.

### 2.1 Runtime & Package Manager

| Technology | Version | Purpose |
|---|---|---|
| **Bun** | v1.3.10 (latest) | All-in-one JS runtime, bundler, test runner, package manager |
| TypeScript | v5.x | Type-safe JavaScript across all packages |

### 2.2 Backend Stack

| Technology | Version | Purpose |
|---|---|---|
| NestJS | v10.4.x (latest stable, v12 coming Q3 2026) | Backend framework with modular architecture |
| Prisma ORM | v7.x | Database ORM with type-safe queries |
| @prisma/adapter-libsql | v7.4.x | Turso/libSQL adapter for Prisma |
| @libsql/client | latest | LibSQL client for Turso connection |
| Turso (libSQL) | Cloud hosted | Edge-distributed SQLite database |
| Upstash Redis | REST API | Serverless Redis for caching & rate limiting |
| Cloudflare R2 | S3-compatible | Evidence file storage (free egress) |
| Cloudflare Turnstile | v0 | Bot protection (CAPTCHA alternative) |
| Passport.js | v0.7.x | GitHub OAuth authentication |
| class-validator | v0.14.x | DTO validation with decorators |
| Vercel | Serverless | Production deployment platform |

### 2.3 Frontend Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | v16.x (latest stable) | React meta-framework with App Router |
| React | v19.x | UI component library |
| Tailwind CSS | v4.x | Utility-first CSS framework |
| NextAuth.js (Auth.js) | v5.x | Authentication (GitHub OAuth) |
| Inter Font | Variable | Vietnamese diacritic support |
| Lucide React | latest | Icon library |
| React Hook Form | v7.x | Form management |
| Zod | v3.x | Schema validation (shared with backend DTOs) |

### 2.4 Development Tools

| Tool | Version | Purpose |
|---|---|---|
| Bun Workspaces | Native | Monorepo workspace management |
| ESLint | v9.x (flat config) | Code linting |
| Prettier | v3.x | Code formatting |
| Husky | v9.x | Git hooks for pre-commit checks |
| Turso CLI | latest | Database management & migrations |
| Docker Compose | v2.x | Local development environment |

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
  [User Browser] ──────► [Next.js Frontend (Vercel Edge)]
        │                           │
        │               [NextAuth.js (GitHub OAuth)]
        │                           │
        └──────────► [NestJS API (Vercel Serverless)]
                           │              │              │
                     [Turso DB]    [Upstash Redis]  [Cloudflare R2]
                     (libSQL)      (Cache/Rate)     (Evidence Files)
                           │
                   [Cloudflare Turnstile] (Bot Protection)
```

### 3.2 Data Flow: Search

1. User enters bank account number or username on frontend
2. Frontend sends `GET /api/v1/cases/search?q=...&bankCode=...` to backend
3. Backend checks Upstash Redis cache first
4. On cache miss: queries Turso DB for approved cases matching the identifier
5. Returns scammer profile + recent 5 cases (paginated view-more available)
6. Result cached in Redis with configurable TTL

### 3.3 Data Flow: Submit Case

1. User fills anonymous report form with Turnstile captcha
2. Frontend uploads evidence files to Cloudflare R2 via presigned URLs
3. Frontend POSTs case data to `/api/v1/cases` with file references
4. Backend validates Turnstile token, checks rate limits (Upstash Redis)
5. Case stored in Turso with status: `PENDING`
6. Cache invalidated for the affected bank identifier

### 3.4 Data Flow: Admin Review

1. Admin authenticates via GitHub OAuth (NextAuth.js)
2. Frontend sends JWT token in `Authorization` header
3. Backend verifies JWT and checks admin whitelist
4. Admin reviews pending cases, adds refined description, approves/rejects
5. On approval: scammer profile created/updated with aggregated stats
6. Cache invalidated; case becomes publicly searchable

---

## 4. Infrastructure & Deployment

### 4.1 Environment Configuration

| Environment | Details |
|---|---|
| Local Development | SQLite file (dev.db) + local Redis mock + local R2 mock |
| Staging | Turso dev branch + Upstash free tier + R2 dev bucket |
| Production | Turso production + Upstash production + R2 production bucket |

### 4.2 Cost Analysis

| Phase | Users | Monthly Cost |
|---|---|---|
| MVP (0–1K users) | 1,000 | $0–1 |
| Growth (1K–10K) | 10,000 | $30–50 |
| Scale (10K–100K) | 100,000 | $150–200 |

**Free tier breakdown (MVP):** Vercel free, Turso free (9GB, 500M rows), Upstash free (10K cmd/day), R2 free (10GB), Turnstile free (1M/month), Domain ~$10/year.

---

# PART B — MONOREPO SETUP (Bun Workspaces)

---

## 5. Monorepo Structure

```
skam/
├── bun.lock                          # Bun lockfile (text format)
├── package.json                      # Root workspace config
├── tsconfig.json                     # Root TypeScript config
├── .gitignore
├── .env.example
├── docker-compose.yml                # Local development services
├── README.md
│
├── apps/
│   ├── api/                          # NestJS Backend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   ├── vercel.json
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   └── ... (modules)
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── migrations/
│   │
│   └── web/                          # Next.js Frontend
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── ... (pages)
│       └── components/
│           └── ... (UI components)
│
├── packages/
│   ├── shared/                       # Shared types, utils, constants
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts              # Barrel export
│   │       ├── types/
│   │       │   ├── case.ts           # ScamCase, CaseStatus types
│   │       │   ├── profile.ts        # ScammerProfile types
│   │       │   ├── bank.ts           # Bank, BankResponse types
│   │       │   ├── api.ts            # ApiResponse, PaginatedResponse
│   │       │   └── index.ts
│   │       ├── constants/
│   │       │   ├── banks.ts          # Bank code constants
│   │       │   ├── cache.ts          # Cache TTL constants
│   │       │   ├── limits.ts         # Rate limit constants
│   │       │   └── index.ts
│   │       ├── utils/
│   │       │   ├── format.ts         # formatVND, formatDate
│   │       │   ├── hash.ts           # SHA-256 hashing
│   │       │   ├── validate.ts       # Shared validation schemas (Zod)
│   │       │   └── index.ts
│   │       └── schemas/
│   │           ├── case.schema.ts    # Zod schemas for case validation
│   │           ├── search.schema.ts  # Zod schemas for search
│   │           └── index.ts
│   │
│   ├── ui/                           # Shared UI components (optional)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       ├── Card.tsx
│   │       └── index.ts
│   │
│   └── config/                       # Shared configs
│       ├── package.json
│       ├── eslint/
│       │   └── index.js              # Shared ESLint config
│       ├── typescript/
│       │   └── base.json             # Shared tsconfig base
│       └── prettier/
│           └── index.js              # Shared Prettier config
```

---

## 6. Bun Workspace Configuration

### 6.1 Root `package.json`

```json
{
  "name": "skam",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "bun run --filter '*' dev",
    "dev:api": "bun run --cwd apps/api dev",
    "dev:web": "bun run --cwd apps/web dev",
    "build": "bun run --filter '*' build",
    "build:api": "bun run --cwd apps/api build",
    "build:web": "bun run --cwd apps/web build",
    "lint": "bun run --filter '*' lint",
    "typecheck": "bun run --filter '*' typecheck",
    "test": "bun run --filter '*' test",
    "db:migrate": "bun run --cwd apps/api prisma:migrate",
    "db:push": "bun run --cwd apps/api prisma:push",
    "db:studio": "bun run --cwd apps/api prisma:studio",
    "clean": "rm -rf node_modules apps/*/node_modules packages/*/node_modules",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.7.0",
    "prettier": "^3.4.0",
    "eslint": "^9.17.0",
    "husky": "^9.1.0"
  }
}
```

### 6.2 Root `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### 6.3 Apps: `apps/api/package.json`

```json
{
  "name": "@skam/api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start:prod": "node dist/main",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "test": "bun test",
    "prisma:migrate": "prisma migrate dev",
    "prisma:push": "prisma db push",
    "prisma:studio": "prisma studio",
    "prisma:generate": "prisma generate"
  },
  "dependencies": {
    "@skam/shared": "workspace:*",
    "@nestjs/common": "^10.4.0",
    "@nestjs/core": "^10.4.0",
    "@nestjs/platform-express": "^10.4.0",
    "@nestjs/config": "^3.3.0",
    "@nestjs/passport": "^10.0.3",
    "@prisma/client": "^7.4.0",
    "@prisma/adapter-libsql": "^7.4.0",
    "@libsql/client": "^0.14.0",
    "@upstash/redis": "^1.34.0",
    "passport": "^0.7.0",
    "passport-github2": "^0.1.12",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.0",
    "prisma": "^7.4.0",
    "typescript": "^5.7.0"
  }
}
```

### 6.4 Apps: `apps/web/package.json`

```json
{
  "name": "@skam/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@skam/shared": "workspace:*",
    "@skam/ui": "workspace:*",
    "next": "^16.1.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "next-auth": "^5.0.0",
    "lucide-react": "^0.470.0",
    "react-hook-form": "^7.54.0",
    "zod": "^3.24.0",
    "@hookform/resolvers": "^3.9.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0"
  }
}
```

### 6.5 Packages: `packages/shared/package.json`

```json
{
  "name": "@skam/shared",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types/index.ts",
    "./constants": "./src/constants/index.ts",
    "./utils": "./src/utils/index.ts",
    "./schemas": "./src/schemas/index.ts"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.7.0",
    "zod": "^3.24.0"
  }
}
```

---

## 7. Shared Packages

### 7.1 Usage Across Apps

```typescript
// In apps/api (NestJS service)
import { ScamCase, CaseStatus } from '@skam/shared/types';
import { CACHE_TTL, RATE_LIMITS } from '@skam/shared/constants';
import { formatVND, hashSHA256 } from '@skam/shared/utils';
import { CreateCaseSchema } from '@skam/shared/schemas';

// In apps/web (Next.js component)
import type { ScamCase, Bank } from '@skam/shared/types';
import { formatVND, formatDate } from '@skam/shared/utils';
import { SearchSchema } from '@skam/shared/schemas';
```

### 7.2 Key Shared Types

```typescript
// packages/shared/src/types/case.ts
export enum CaseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface ScamCase {
  id: string;
  bankIdentifier: string;
  bankName: string;
  bankCode: string;
  amount: number | null;
  scammerName: string | null;
  originalDescription: string;
  refinedDescription: string | null;
  status: CaseStatus;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScammerProfile {
  id: string;
  bankIdentifier: string;
  bankCode: string;
  scammerName: string | null;
  totalCases: number;
  totalAmount: number;
  firstReportedAt: string;
  lastReportedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
```

---

## 8. Scripts & Commands

### 8.1 Daily Development

```bash
# Install all dependencies (from root)
bun install

# Start both apps in dev mode
bun run dev

# Start only backend
bun run dev:api

# Start only frontend
bun run dev:web

# Run all tests
bun run test

# Lint everything
bun run lint

# Type check everything
bun run typecheck
```

### 8.2 Adding Dependencies

```bash
# Add to specific workspace
bun add express --cwd apps/api
bun add -d @types/express --cwd apps/api

# Add to root (dev tools)
bun add -d prettier -w

# Link shared package (automatic via workspace:*)
# Just add "@skam/shared": "workspace:*" to dependencies
```

### 8.3 Database Operations

```bash
# Create migration locally
bun run db:migrate -- --name add_social_links

# Push schema to Turso
bun run db:push

# Open Prisma Studio
bun run db:studio

# Apply migration to Turso via CLI
turso db shell skam < apps/api/prisma/migrations/{latest}/migration.sql
```

---

# PART C — BACKEND DOCUMENTATION (NestJS)

---

## 9. Backend Project Structure

```
apps/api/
  src/
    main.ts                          # App bootstrap + Vercel adapter
    app.module.ts                    # Root module
    config/
      database.config.ts             # Turso/SQLite connection config
      redis.config.ts                # Upstash Redis config
      cloudflare.config.ts           # R2 + Turnstile config
      auth.config.ts                 # GitHub OAuth + admin whitelist
    common/
      decorators/                    # @AdminOnly, @Public, @RateLimit
      guards/                        # AdminGuard, GitHubAuthGuard
      filters/                       # HttpExceptionFilter, PrismaExceptionFilter
      interceptors/                  # CacheInterceptor, LoggingInterceptor
      pipes/                         # ValidationPipe (class-validator)
      utils/                         # hash.util, text.util, fingerprint.util
    database/
      database.module.ts             # Global DatabaseModule
      prisma.service.ts              # PrismaClient with Turso adapter
    cache/
      cache.module.ts                # CacheModule wrapping Upstash Redis
      cache.service.ts               # get/set/del/invalidate helpers
    storage/
      storage.module.ts              # R2 file operations
      storage.service.ts             # Upload, download, presigned URLs
      dto/upload-file.dto.ts
    turnstile/
      turnstile.module.ts            # Cloudflare Turnstile verification
      turnstile.service.ts
    auth/
      auth.module.ts                 # GitHub OAuth + JWT
      auth.service.ts
      auth.controller.ts
      strategies/github.strategy.ts
      constants/admin-whitelist.ts   # Constant array of admin usernames
    cases/
      cases.module.ts                # Core CRUD for scam cases
      cases.service.ts
      cases.controller.ts
      dto/create-case.dto.ts
      dto/search-case.dto.ts
      dto/paginate-case.dto.ts
    profiles/
      profiles.module.ts             # Scammer profile aggregation
      profiles.service.ts
      profiles.controller.ts
    admin/
      admin.module.ts                # Admin approval workflow
      admin.service.ts
      admin.controller.ts
      dto/approve-case.dto.ts
      dto/reject-case.dto.ts
      dto/refine-case.dto.ts
    analytics/
      analytics.module.ts            # SystemStats + summary endpoints
      analytics.service.ts
      analytics.controller.ts
    banks/
      banks.module.ts                # VietQR bank list with cache
      banks.service.ts
      banks.controller.ts
    health/
      health.module.ts
      health.controller.ts
  prisma/
    schema.prisma                    # Database schema definition
    migrations/                      # Local SQLite migrations
```

---

## 10. Database Schema (Prisma + Turso)

### 10.1 Migration Strategy

- **Development:** `prisma migrate dev` against local SQLite file (`dev.db`)
- **Production:** Generate SQL with `prisma migrate diff`, apply via Turso CLI
- **Prisma Migrate NOT compatible** with `libsql://` protocol directly
- **PrismaService auto-detects** environment: Turso credentials present = production adapter

### 10.2 Entity Relationships

```
ScamCase (1) ────< (N) EvidenceFile
ScamCase (N) >──── (1) ScammerProfile
ScamCase (N) ────< (N) SocialLink
ScammerProfile (1) ────< (N) SocialLink
SystemStats (singleton)
```

### 10.3 ScamCase

| Field | Type | Description |
|---|---|---|
| id | `String @id @default(cuid())` | Primary key |
| createdAt | `DateTime @default(now())` | Submission timestamp |
| updatedAt | `DateTime @updatedAt` | Last modification |
| bankIdentifier | `String` | Account number or username |
| bankName | `String` | Account holder name (lowercase) |
| bankCode | `String` | 3-char bank code (TCB, VCB, MB...) |
| amount | `Float?` | Total scam amount in VND |
| scammerName | `String?` | Known scammer name |
| originalDescription | `String` | User-submitted case description |
| refinedDescription | `String?` | Admin-enhanced description |
| status | `CaseStatus @default(PENDING)` | PENDING / APPROVED / REJECTED |
| approvedAt | `DateTime?` | When admin approved |
| approvedBy | `String?` | Admin GitHub username |
| rejectionReason | `String?` | Reason if rejected |
| submitterFingerprint | `String?` | Browser fingerprint (hashed) |
| submitterIpHash | `String?` | SHA-256 hashed IP address |
| viewCount | `Int @default(0)` | Number of times viewed |
| profileId | `String?` | FK to ScammerProfile |

**Indexes:** `@@index([bankIdentifier, bankCode])`, `@@index([status])`, `@@index([createdAt])`, `@@index([profileId])`, `@@index([submitterFingerprint])`

### 10.4 ScammerProfile

| Field | Type | Description |
|---|---|---|
| id | `String @id @default(cuid())` | Primary key |
| bankIdentifier | `String @unique` | One profile per bank identifier |
| bankCode | `String` | Bank code |
| scammerName | `String?` | Most commonly reported name |
| totalCases | `Int @default(0)` | Count of approved cases |
| totalAmount | `Float @default(0)` | Sum of scam amounts |
| firstReportedAt | `DateTime` | Earliest case date |
| lastReportedAt | `DateTime` | Latest case date |

### 10.5 EvidenceFile

| Field | Type | Description |
|---|---|---|
| id | `String @id @default(cuid())` | Primary key |
| caseId | `String (FK)` | References ScamCase.id |
| fileType | `String` | chat_screenshot / bank_transaction / other |
| fileKey | `String` | R2 bucket object key |
| fileName | `String?` | Original file name |
| fileSize | `Int?` | File size in bytes |
| fileHash | `String?` | SHA-256 hash for deduplication |
| isApproved | `Boolean @default(false)` | Admin approved for public view |

### 10.6 SocialLink

| Field | Type | Description |
|---|---|---|
| id | `String @id @default(cuid())` | Primary key |
| platform | `SocialPlatform` | FACEBOOK / ZALO / TELEGRAM / X / TIKTOK |
| url | `String` | Social profile URL |
| username | `String?` | Username if extractable |
| caseId | `String? (FK)` | References ScamCase.id |
| profileId | `String? (FK)` | References ScammerProfile.id |

### 10.7 SystemStats (Singleton)

| Field | Type | Description |
|---|---|---|
| id | `String @id @default("singleton")` | Always one row |
| totalCases | `Int @default(0)` | All cases in DB |
| totalApprovedCases | `Int @default(0)` | Approved count |
| totalPendingCases | `Int @default(0)` | Pending count |
| totalScammerProfiles | `Int @default(0)` | Unique profiles |
| totalScamAmount | `Float @default(0)` | Sum of all amounts |

### 10.8 Enums

| Enum | Values |
|---|---|
| CaseStatus | `PENDING` / `APPROVED` / `REJECTED` |
| SocialPlatform | `FACEBOOK` / `ZALO` / `TELEGRAM` / `X` / `TIKTOK` / `INSTAGRAM` |

---

## 11. NestJS Modules Breakdown

**DatabaseModule (Global)** — PrismaService with auto-detection: local SQLite vs Turso adapter. Constructor checks `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` env vars. Uses `@prisma/adapter-libsql` with `PrismaLibSQL` for production.

**CacheModule (Global)** — Wraps Upstash Redis REST API. Methods: `get<T>(key)`, `set(key, value, ttl?)`, `del(key)`, `invalidatePattern(prefix)`. Cache key convention: `{entity}:{identifier}`.

**CasesModule** — `POST /cases` (submit), `GET /cases/search` (search), `GET /cases/:id` (detail). Turnstile verification on POST. Rate limited 5 submissions/IP/day.

**AdminModule** — `GET /admin/cases/pending`, `PATCH /admin/cases/:id/approve`, `PATCH /admin/cases/:id/reject`. Protected by AdminGuard: JWT + GitHub username whitelist.

**ProfilesModule** — Auto-created on first case approval. Aggregated fields updated: totalCases, totalAmount. Social links merged from new cases.

**StorageModule** — Presigned URL generation for R2. SHA-256 hash dedup. File type + size validation.

**AuthModule** — GitHub OAuth via Passport.js. JWT generation. NextAuth.js integration for frontend tokens.

**BanksModule** — VietQR API integration. 7-day Redis cache. Search by name/code/shortName.

**AnalyticsModule** — SystemStats singleton. Public summary endpoint.

---

## 12. API Endpoints Reference

### 12.1 Public Endpoints (No Auth)

| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| GET | `/api/v1/health` | Health check | None |
| GET | `/api/v1/banks` | List all Vietnamese banks | 100/min |
| GET | `/api/v1/banks/search?q=` | Search banks | 100/min |
| GET | `/api/v1/cases/search` | Search by identifier + code | 30/min |
| GET | `/api/v1/cases/:id` | Case detail (approved only) | 60/min |
| GET | `/api/v1/profiles/:identifier` | Scammer profile | 30/min |
| POST | `/api/v1/cases` | Submit new case (Turnstile) | 5/day/IP |
| POST | `/api/v1/upload/presign` | Get R2 presigned URL | 10/min |
| GET | `/api/v1/analytics/summary` | Public stats | 60/min |

### 12.2 Admin Endpoints (Auth Required)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/admin/cases` | List all cases (filterable) |
| GET | `/api/v1/admin/cases/pending` | Pending queue |
| PATCH | `/api/v1/admin/cases/:id/approve` | Approve case |
| PATCH | `/api/v1/admin/cases/:id/reject` | Reject case |
| PATCH | `/api/v1/admin/cases/:id/refine` | Update refined description |
| DELETE | `/api/v1/admin/cases/:id` | Delete case |
| GET | `/api/v1/admin/analytics` | Detailed analytics |
| POST | `/api/v1/admin/banks/refresh` | Force refresh cache |

### 12.3 Auth Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/auth/github` | Initiate GitHub OAuth |
| GET | `/api/v1/auth/github/callback` | OAuth callback |
| GET | `/api/v1/auth/me` | Current admin profile |
| POST | `/api/v1/auth/logout` | Invalidate session |

---

## 13. Authentication & Authorization

**Admin whitelist:** constant array in code. No database. Add username → redeploy.

```typescript
// src/auth/constants/admin-whitelist.ts
export const ADMIN_WHITELIST = ['crazyads69', 'admin2'];
```

**Flow:** NextAuth.js (frontend) handles OAuth → JWT → backend verifies JWT signature using shared `NEXTAUTH_SECRET` → extracts GitHub username → checks whitelist.

**Regular users:** NO authentication. All public features are fully anonymous.

---

## 14. Caching Strategy

| Cache Key Pattern | TTL | Invalidation Trigger |
|---|---|---|
| `case:{bankCode}:{identifier}` | 1 hour | New case approved |
| `cases:search:{query_hash}` | 10 min | New case approved |
| `banks:list` | 24 hours | Admin force refresh |
| `stats:summary` | 10 min | Any status change |
| `profile:{bankIdentifier}` | 1 hour | New case approved |
| `file:{hash}` | 30 days | File deleted |

---

## 15. File Storage (Cloudflare R2)

**Upload flow:** Frontend hashes file (SHA-256) → requests presigned URL → backend checks hash for dedup → generates presigned PUT URL (15-min expiry) → frontend uploads directly to R2 → sends file key with case.

| File Type | Max Size | Extensions |
|---|---|---|
| Images | 10MB | .jpg, .jpeg, .png, .webp |
| Videos | 100MB | .mp4, .webm |
| Audio | 50MB | .mp3, .wav |
| Documents | 10MB | .pdf, .docx |

Max 5 evidence files per case.

---

## 16. Security & Rate Limiting

| Endpoint Category | Limit | Window |
|---|---|---|
| Case submission | 5 requests | Per IP per day |
| Search queries | 30 requests | Per IP per minute |
| File uploads | 10 requests | Per IP per minute |
| General API | 100 requests | Per IP per minute |
| Auth endpoints | 10 requests | Per IP per minute |

**Bot prevention:** Cloudflare Turnstile on all forms. Server-side token verification. Single-use tokens.

**Data privacy:** IPs SHA-256 hashed with server salt. Fingerprints hashed. No personal data collected. Compliance with Vietnamese Decree 13/2023.

---

# PART D — FRONTEND DOCUMENTATION (Next.js)

---

## 17. Frontend Project Structure

```
apps/web/
  app/                               # Next.js App Router
    layout.tsx                       # Root layout + providers
    page.tsx                         # Home / Search page
    globals.css                      # Tailwind + custom styles
    (public)/                        # Public routes group
      search/page.tsx                # Search results
      case/[id]/page.tsx             # Case detail
      report/page.tsx                # Submit case form
      profile/[identifier]/page.tsx  # Scammer profile
    (admin)/                         # Admin routes group
      admin/layout.tsx               # Admin auth check
      admin/page.tsx                 # Dashboard
      admin/cases/page.tsx           # Pending queue
      admin/cases/[id]/page.tsx      # Case review
    api/
      auth/[...nextauth]/route.ts    # NextAuth handler
  components/
    ui/                              # Base UI (Button, Input, Badge, Card, Modal)
    search/                          # SearchBar, SearchResults, BankSelector
    report/                          # ReportForm, EvidenceUploader, TurnstileWidget
    case/                            # CaseCard, CaseDetail, EvidenceGallery, ScammerProfile
    admin/                           # AdminSidebar, CaseReviewPanel, ApprovalActions
    layout/                          # Header, Footer, MobileNav
  lib/
    api.ts                           # API client (fetch wrapper)
    auth.ts                          # NextAuth config
    utils.ts                         # Helpers
    constants.ts                     # API URLs
  hooks/
    useSearch.ts, useCases.ts, useUpload.ts
  types/
    (uses @skam/shared/types)
```

---

## 18. Pages & Routing

**Home (/)** — Hero section with stats, prominent search bar, bank selector, recent cases carousel, "Report a Scam" CTA.

**Search Results (/search?q=...&bank=...)** — Profile card if match, recent 5 cases, "View More" pagination, filters.

**Case Detail (/case/[id])** — Full description, evidence gallery, social links, related cases.

**Report (/report)** — 3-step wizard: (1) Bank info, (2) Case details + social links, (3) Evidence upload + Turnstile.

**Admin (/admin)** — Protected. Pending count, quick stats, case review queue, refined editor.

---

## 19. Components Library

**State management:** Server Components default. `useState`/`useReducer` for forms. Server-side fetch for data. `useSession()` for admin auth. URL params for search.

---

# PART E — DESIGN SYSTEM (Dark + Neon Green)

---

## 21. Design Philosophy & Brand Identity

### Vision

A dark, cybersecurity-inspired aesthetic that communicates technological authority and digital protection. The green neon on dark background evokes hacker culture, cybersecurity dashboards, and digital vigilance — making users feel they're accessing a powerful protective tool.

### Core Principles

1. **Dark Authority** — Dark backgrounds create a sense of seriousness, security, and digital sophistication. Users should feel like they've accessed a serious security tool, not a casual website.
2. **Neon Signal** — Green neon acts as a digital signal, highlighting actions, safety indicators, and interactive elements against the dark canvas. It represents "the system is active and protecting you."
3. **Glassmorphism Trust** — Semi-transparent cards with backdrop blur create depth and modernity while maintaining readability. This layered feel reinforces the idea of multiple layers of protection.
4. **Mobile-First Vietnam** — Optimized for lower-end Android devices common in Vietnam. Minimal animations, compressed assets, lazy loading. Must work on 3G.
5. **Clarity Under Stress** — Users arriving at this platform may be stressed (just scammed or about to transfer money). Every element must be immediately clear with zero cognitive load.

### Brand Voice

- **Vietnamese:** Formal but accessible (phong cách nghiêm túc nhưng dễ hiểu)
- **Tone:** Protective, authoritative, community-driven
- **Never:** Alarmist, accusatory, or sensationalized

---

## 22. Color System

### 22.1 Primary Palette

```
┌─────────────────────────────────────────────────────┐
│  NEON GREEN (Primary Action)                        │
│  ─────────────────────────────────                  │
│  Primary-50:   #F0FFF4    (tint for backgrounds)    │
│  Primary-100:  #C6F6D5    (light surface)           │
│  Primary-200:  #9AE6B4    (hover light)             │
│  Primary-300:  #68D391    (soft accent)             │
│  Primary-400:  #48BB78    (secondary text on dark)  │
│  Primary-500:  #00FF7F    (★ NEON GREEN - primary)  │
│  Primary-600:  #00E06F    (hover state)             │
│  Primary-700:  #00C25F    (active/pressed)          │
│  Primary-800:  #00A34F    (dark accent)             │
│  Primary-900:  #007A3B    (darkest green)           │
│                                                      │
│  Glow Effect: 0 0 20px rgba(0, 255, 127, 0.4)      │
│  Text Glow:   0 0 10px rgba(0, 255, 127, 0.6)      │
└─────────────────────────────────────────────────────┘
```

### 22.2 Dark Background Palette

```
┌─────────────────────────────────────────────────────┐
│  DARK BACKGROUNDS                                    │
│  ─────────────────                                   │
│  Dark-950:     #0A0A0F    (★ deepest - page bg)     │
│  Dark-900:     #0D1117    (★ primary surface)        │
│  Dark-800:     #161B22    (★ card background)        │
│  Dark-700:     #21262D    (elevated surface)         │
│  Dark-600:     #30363D    (borders / dividers)       │
│  Dark-500:     #484F58    (disabled / muted)         │
│  Dark-400:     #6E7681    (placeholder text)         │
│  Dark-300:     #8B949E    (secondary text)           │
│  Dark-200:     #C9D1D9    (body text)                │
│  Dark-100:     #E6EDF3    (primary text)             │
│  Dark-50:      #F0F6FC    (brightest text)           │
└─────────────────────────────────────────────────────┘
```

### 22.3 Semantic Colors

```
┌─────────────────────────────────────────────────────┐
│  SEMANTIC STATUS COLORS                              │
│  ───────────────────────                             │
│                                                      │
│  ✅ Safe/Verified:   #00FF7F  (neon green)           │
│     Background:      rgba(0, 255, 127, 0.1)         │
│     Border:          rgba(0, 255, 127, 0.3)         │
│                                                      │
│  ⚠️  Warning/Pending: #FFBE0B  (amber)               │
│     Background:      rgba(255, 190, 11, 0.1)        │
│     Border:          rgba(255, 190, 11, 0.3)        │
│                                                      │
│  🔴 Danger/Scam:     #FF3B3B  (red)                  │
│     Background:      rgba(255, 59, 59, 0.1)         │
│     Border:          rgba(255, 59, 59, 0.3)         │
│                                                      │
│  ℹ️  Info/Neutral:    #3B82F6  (blue)                 │
│     Background:      rgba(59, 130, 246, 0.1)        │
│     Border:          rgba(59, 130, 246, 0.3)        │
└─────────────────────────────────────────────────────┘
```

### 22.4 Tailwind CSS Config (Dark + Neon)

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        neon: {
          50: '#F0FFF4', 100: '#C6F6D5', 200: '#9AE6B4',
          300: '#68D391', 400: '#48BB78', 500: '#00FF7F',
          600: '#00E06F', 700: '#00C25F', 800: '#00A34F', 900: '#007A3B',
        },
        dark: {
          50: '#F0F6FC', 100: '#E6EDF3', 200: '#C9D1D9',
          300: '#8B949E', 400: '#6E7681', 500: '#484F58',
          600: '#30363D', 700: '#21262D', 800: '#161B22',
          900: '#0D1117', 950: '#0A0A0F',
        },
        danger: '#FF3B3B',
        warning: '#FFBE0B',
        safe: '#00FF7F',
        info: '#3B82F6',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 255, 127, 0.4)',
        'neon-sm': '0 0 10px rgba(0, 255, 127, 0.3)',
        'neon-lg': '0 0 40px rgba(0, 255, 127, 0.5)',
        'neon-text': '0 0 10px rgba(0, 255, 127, 0.6)',
        'danger': '0 0 20px rgba(255, 59, 59, 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        'glass': '16px',
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        'grid': 'linear-gradient(rgba(0,255,127,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,127,0.03) 1px, transparent 1px)',
      },
    },
  },
}
```

---

## 23. Typography

### 23.1 Font Stack

```
Primary:    Inter (variable weight, excellent Vietnamese diacritics)
Monospace:  JetBrains Mono (code blocks, account numbers)
Fallback:   system-ui, -apple-system, sans-serif
```

### 23.2 Type Scale

| Token | Size | Weight | Line Height | Use Case |
|---|---|---|---|---|
| Display | 48px / 3rem | Bold (700) | 1.2 | Hero headline only |
| H1 | 36px / 2.25rem | Bold (700) | 1.3 | Page titles |
| H2 | 28px / 1.75rem | Semibold (600) | 1.35 | Section headers |
| H3 | 22px / 1.375rem | Semibold (600) | 1.4 | Card titles |
| Body Large | 18px / 1.125rem | Regular (400) | 1.6 | Descriptions |
| Body | 16px / 1rem | Regular (400) | 1.6 | Default body text |
| Body Small | 14px / 0.875rem | Regular (400) | 1.5 | Secondary info |
| Caption | 12px / 0.75rem | Medium (500) | 1.5 | Labels, timestamps |
| Mono | 14px / 0.875rem | Regular (400) | 1.4 | Account numbers |

**Vietnamese note:** Always use `line-height: 1.5` minimum. Vietnamese tone marks (ắ, ồ, ứ, ễ) need vertical space. Text is 20–30% longer than English equivalents.

---

## 24. Spacing & Layout Grid

### 24.1 Spacing Scale

```
4px   (xs)     — tight internal padding
8px   (sm)     — between related elements
12px  (md)     — component internal padding
16px  (lg)     — between components
24px  (xl)     — section padding
32px  (2xl)    — between sections
48px  (3xl)    — major section gaps
64px  (4xl)    — page-level spacing
```

### 24.2 Layout

```
Max content width:   1200px (desktop)
Page padding:        16px (mobile), 24px (tablet), 32px (desktop)
Card padding:        16px (mobile), 24px (desktop)
Grid columns:        1 (mobile), 2 (tablet), 3 (desktop)
Grid gap:            16px (mobile), 24px (desktop)
```

### 24.3 Breakpoints

| Name | Width | Target |
|---|---|---|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |

---

## 25. Component Specifications

### 25.1 Glassmorphism Card (Base)

```css
.glass-card {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.05) 0%, 
    rgba(255, 255, 255, 0.02) 100%);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Tailwind equivalent */
/* bg-glass backdrop-blur-glass border border-white/[0.08] rounded-2xl shadow-glass */
```

### 25.2 Neon Button (Primary)

```
Background:     #00FF7F
Text color:     #0A0A0F (dark on bright)
Border radius:  12px
Padding:        12px 24px
Font:           Inter Semibold, 16px
Box shadow:     0 0 20px rgba(0, 255, 127, 0.4)

Hover:          background #00E06F, shadow 0 0 30px rgba(0, 255, 127, 0.6)
Active:         background #00C25F, shadow 0 0 10px rgba(0, 255, 127, 0.3)
Disabled:       background #484F58, no shadow, text #6E7681

Tailwind:       bg-neon-500 text-dark-950 font-semibold rounded-xl
                px-6 py-3 shadow-neon hover:bg-neon-600 hover:shadow-neon-lg
                active:bg-neon-700 disabled:bg-dark-500 disabled:shadow-none
```

### 25.3 Secondary Button (Ghost)

```
Background:     transparent
Text color:     #00FF7F
Border:         1px solid rgba(0, 255, 127, 0.3)
Border radius:  12px

Hover:          background rgba(0, 255, 127, 0.1)
Active:         background rgba(0, 255, 127, 0.15)
```

### 25.4 Danger Button

```
Background:     #FF3B3B
Text color:     #FFFFFF
Box shadow:     0 0 20px rgba(255, 59, 59, 0.4)
Hover:          background #E02020
```

### 25.5 Search Input

```
Background:     rgba(255, 255, 255, 0.05)
Border:         1px solid rgba(255, 255, 255, 0.1)
Border radius:  12px
Text color:     #E6EDF3
Placeholder:    #6E7681
Padding:        16px 16px 16px 48px (left for search icon)
Font:           JetBrains Mono, 16px (for account numbers)

Focus:          border-color: #00FF7F
                box-shadow: 0 0 0 3px rgba(0, 255, 127, 0.15)
```

### 25.6 Status Badges

```
Reported (Danger):
  Background: rgba(255, 59, 59, 0.15)
  Text:       #FF3B3B
  Border:     1px solid rgba(255, 59, 59, 0.3)
  Dot:        pulsing #FF3B3B circle

Pending (Warning):
  Background: rgba(255, 190, 11, 0.15)
  Text:       #FFBE0B
  Border:     1px solid rgba(255, 190, 11, 0.3)

Verified (Safe):
  Background: rgba(0, 255, 127, 0.15)
  Text:       #00FF7F
  Border:     1px solid rgba(0, 255, 127, 0.3)
```

### 25.7 Case Result Card

```
Container:      Glass card (see 25.1)
Left accent:    4px solid border-left
                #FF3B3B (reported) / #FFBE0B (pending) / #00FF7F (verified)
Title:          H3, text-dark-100
Bank info:      Caption, mono font, text-neon-400
Amount:         Body Large, bold, text-danger (#FF3B3B)
Description:    Body, text-dark-200, line-clamp-3
Footer:         Caption, text-dark-300 (date + view count)
```

### 25.8 Scammer Profile Card

```
Container:      Glass card with thicker border (2px rgba(255,59,59,0.3))
Header:         Dark-700 background area
Avatar:         64px circle with first letter, bg-danger, text-white
Name:           H2, text-dark-100
Bank info:      Mono font, text-neon-400
Stats row:      3-column grid
                Total Cases:   Number in text-danger, label in text-dark-300
                Total Amount:  Number in text-danger, formatted VND
                First Report:  Date in text-dark-200
Risk indicator: Full-width bar, gradient from #FFBE0B → #FF3B3B
```

### 25.9 Modal (Overlay)

```
Overlay:        rgba(0, 0, 0, 0.7) with backdrop-blur-sm
Container:      Glass card, max-width 480px (mobile) / 600px (desktop)
                width 90% mobile / auto desktop
Header:         H3 + close button (top-right)
                Border-bottom: 1px solid Dark-600
Body:           max-height 60vh, overflow-y auto
Footer:         Border-top Dark-600, flex justify-end, gap 12px
```

### 25.10 Loading States

```
Skeleton:       background linear-gradient(Dark-700, Dark-600, Dark-700)
                shimmer animation 1.5s ease-in-out infinite
                border-radius: 8px

Spinner:        40px circle, 4px border
                border-color: Dark-600
                border-top-color: #00FF7F
                animation: rotate 0.8s linear infinite
```

---

## 26. Page Templates & Patterns

### 26.1 Home / Search Page

```
┌──────────────────────────────────────┐
│  [Logo]              [Báo cáo lừa đảo] (neon button)
├──────────────────────────────────────┤
│                                      │
│     🛡️ KIỂM TRA TÀI KHOẢN          │  (Display, text-glow)
│     NGÂN HÀNG                        │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🔍 Nhập số tài khoản...       │  │  (Search input, large)
│  │    [VCB ▼] bank selector      │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌──────┐  ┌──────┐  ┌──────┐      │  (Stats cards, glass)
│  │12,345│  │8,901 │  │45.2B │      │
│  │Cases │  │Scammers│ │VND   │      │
│  └──────┘  └──────┘  └──────┘      │
│                                      │
│  ── Báo cáo gần đây ──             │  (Recent cases section)
│  ┌──────────────────────────────┐   │
│  │ [Case Card] [Case Card]...   │   │
│  └──────────────────────────────┘   │
│                                      │
├──────────────────────────────────────┤
│  Footer: About | Privacy | Contact   │
└──────────────────────────────────────┘

Background: Dark-950 with subtle grid pattern
Grid:       background-size: 40px 40px
            color: rgba(0, 255, 127, 0.03)
```

### 26.2 Search Results Page

```
┌──────────────────────────────────────┐
│  ← Quay lại    [Search bar mini]     │
├──────────────────────────────────────┤
│                                      │
│  ⚠️ TÀI KHOẢN ĐÃ BỊ BÁO CÁO       │  (Alert banner, danger)
│                                      │
│  ┌─ Scammer Profile Card ──────────┐ │
│  │  [Avatar]  NGUYEN VAN A          │ │
│  │  VCB - ****5678                  │ │
│  │  5 báo cáo | 150.000.000 VND    │ │
│  │  ████████████░░░ Risk: CAO       │ │
│  └──────────────────────────────────┘ │
│                                      │
│  ── 5 Báo cáo gần đây ──           │
│  ┌─ Case Card ─────────────────────┐ │
│  ┃ Lừa đảo bán hàng online        │ │
│  ┃ 50.000.000 VND | 2 ngày trước  │ │
│  └──────────────────────────────────┘ │
│  ┌─ Case Card ─────────────────────┐ │
│  └──────────────────────────────────┘ │
│                                      │
│  [Xem thêm] (ghost button)          │
└──────────────────────────────────────┘
```

### 26.3 Report Form (3-Step Wizard)

```
Step indicators: ① ── ② ── ③
Active step:     Neon green circle + glow
Completed step:  Filled neon green circle + checkmark
Inactive step:   Dark-600 circle

Step 1: Thông tin tài khoản
  - Bank selector (dropdown with logos)
  - Account number (mono input)
  - Account holder name

Step 2: Chi tiết vụ lừa đảo
  - Description (textarea, min 50 chars)
  - Amount (number input, VND)
  - Social links (dynamic add/remove)

Step 3: Bằng chứng
  - Evidence uploader (drag-drop zone)
  - File previews with progress
  - Turnstile widget
  - Submit button (neon, with glow)
```

### 26.4 No Results State

```
┌──────────────────────────────────────┐
│                                      │
│         ✅ (large green checkmark)   │
│                                      │
│    Không tìm thấy báo cáo nào       │  (H2, text-dark-100)
│    cho tài khoản này                 │
│                                      │
│    Tài khoản này chưa bị báo cáo    │  (Body, text-dark-300)
│    trên hệ thống của chúng tôi.     │
│    Tuy nhiên, hãy luôn cẩn thận     │
│    khi giao dịch.                    │
│                                      │
│    [Báo cáo tài khoản này]          │  (ghost button)
│                                      │
└──────────────────────────────────────┘
```

---

## 27. Motion & Animation

| Animation | Duration | Easing | Use Case |
|---|---|---|---|
| Page transition | 200ms | ease-out | Route changes |
| Card hover | 150ms | ease-in-out | Lift effect (translateY -2px) |
| Neon glow pulse | 2s | ease-in-out infinite | Active/live indicators |
| Skeleton shimmer | 1.5s | ease-in-out infinite | Loading states |
| Modal enter | 200ms | ease-out | Scale 0.95→1 + fade |
| Modal exit | 150ms | ease-in | Scale 1→0.95 + fade |
| Toast slide | 300ms | ease-out | Slide from bottom-right |
| Button press | 100ms | ease-in | Scale 0.98 |

**Neon glow pulse keyframes:**

```css
@keyframes neon-pulse {
  0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 127, 0.3); }
  50%      { box-shadow: 0 0 25px rgba(0, 255, 127, 0.6); }
}
```

**Reduce motion:** Always respect `prefers-reduced-motion: reduce`. Disable all animations except opacity transitions.

---

## 28. Accessibility

- **Color contrast:** All text meets WCAG AA. Neon green (#00FF7F) on Dark-900 (#0D1117) = 9.2:1 ratio.
- **Focus indicators:** 2px solid #00FF7F outline, 2px offset, with glow shadow.
- **Keyboard nav:** Tab order follows logical flow. `/ ` shortcut focuses search. `Esc` closes modals.
- **Touch targets:** 44x44px minimum, 8px spacing between targets.
- **Screen readers:** Semantic HTML, ARIA labels on icon-only buttons, `role="alert"` for status messages.
- **Text zoom:** Supports 200% zoom without horizontal scroll.

---

## 29. Vietnamese-Specific Guidelines

| Aspect | Specification |
|---|---|
| Text length | Vietnamese is 20–30% longer than English; use flexible widths |
| Number format | `1.000.000` (dots for thousands), suffix `VND` or `đ` |
| Date format | `DD/MM/YYYY` (e.g., 08/03/2026) |
| Currency | Always `VND` suffix or `đ` symbol |
| Tone | Formal but accessible; "Quý khách" for formal, "bạn" for casual |
| Font | Inter (excellent diacritic support: ắ ồ ứ ễ ạ) |
| Min line height | 1.5 (for tone mark clearance) |
| Min font size | 16px body (prevent iOS zoom on focus) |
| Device target | Samsung Galaxy A series, Xiaomi Redmi (lower-end Android) |
| Connection | Must work on 3G; target LCP <2.5s |

---

# PART F — DEVELOPMENT INSTRUCTION RULES

---

## 30. Code Standards & Conventions

### 30.1 TypeScript Rules

**Rule 1.** STRICT MODE ALWAYS: Enable `strict: true` in all tsconfig.json files. No exceptions.

**Rule 2.** NO ANY TYPE: Never use `any`. Use `unknown` + type guards if truly uncertain. Every function parameter, return type, and variable must be explicitly typed.

**Rule 3.** INTERFACES OVER TYPES: Use interfaces for object shapes, types for unions/intersections only.

**Rule 4.** ENUMS IN PRISMA: Use Prisma-generated enums for CaseStatus, SocialPlatform. Never hardcode string values.

**Rule 5.** SHARED TYPES: Common types live in `@skam/shared`. Import from there in both apps. Never duplicate type definitions.

### 30.2 NestJS Conventions

**Rule 6.** ONE MODULE PER DOMAIN: Each business domain gets its own NestJS module with controller, service, and DTOs.

**Rule 7.** DTO VALIDATION: Every incoming request body MUST have a DTO class with class-validator decorators. Never access `req.body` directly.

**Rule 8.** SERVICE LAYER ONLY: Controllers NEVER contain business logic. Validate input → call service → format output.

**Rule 9.** ERROR HANDLING: Use NestJS built-in exceptions (`NotFoundException`, `BadRequestException`, `UnauthorizedException`). Global `HttpExceptionFilter` catches all.

**Rule 10.** DEPENDENCY INJECTION: Never use `new` for services. Always inject via constructor. Register in module providers.

### 30.3 Next.js Conventions

**Rule 11.** SERVER COMPONENTS DEFAULT: Every component is Server Component unless it needs interactivity. Add `'use client'` ONLY when using hooks, event handlers, or browser APIs.

**Rule 12.** APP ROUTER ONLY: Use App Router (`app/` directory). No Pages Router.

**Rule 13.** LOADING STATES: Every `page.tsx` with async data MUST have a corresponding `loading.tsx` with skeleton UI.

**Rule 14.** ERROR BOUNDARIES: Every route group MUST have an `error.tsx` for graceful error handling with Vietnamese messages.

**Rule 15.** METADATA: Every page MUST export `metadata` or `generateMetadata` for SEO. Vietnamese titles and descriptions.

### 30.4 Naming Conventions

| Item | Convention |
|---|---|
| Files (components) | `PascalCase.tsx` (SearchBar.tsx) |
| Files (utils/hooks) | `camelCase.ts` (useSearch.ts) |
| Files (NestJS) | `kebab-case.ts` (cases.controller.ts) |
| Variables/Functions | `camelCase` (bankIdentifier) |
| Interfaces/Types | `PascalCase` (ScamCase) |
| Constants | `UPPER_SNAKE_CASE` (ADMIN_WHITELIST) |
| Database fields | `camelCase` in Prisma, `snake_case` in SQL |
| API endpoints | `kebab-case` (/api/v1/admin/cases) |
| CSS classes | Tailwind utilities only |
| Environment vars | `UPPER_SNAKE_CASE` (TURSO_DATABASE_URL) |
| Workspace packages | `@skam/{name}` (@skam/shared) |

---

## 31. Git Workflow & Branch Strategy

### 31.1 Branch Structure

| Branch | Purpose |
|---|---|
| `main` | Production-ready. Protected. Auto-deploys to production. |
| `develop` | Integration branch. All features merge here first. |
| `feature/{name}` | New features (e.g., `feature/search-filters`) |
| `fix/{name}` | Bug fixes (e.g., `fix/turnstile-validation`) |
| `hotfix/{name}` | Urgent production fixes. Branch from `main`. |

### 31.2 Commit Message Format

```
{type}({scope}): {subject}

Types:  feat, fix, refactor, docs, style, test, chore
Scope:  cases, auth, admin, search, upload, db, config, ui, shared

Examples:
  feat(cases): add pagination to search results
  fix(auth): handle expired JWT token gracefully
  refactor(db): simplify PrismaService constructor
  docs(api): update endpoint documentation
  chore(shared): add Zod schemas for case validation
```

### 31.3 PR Requirements

- All PRs target `develop` (except hotfixes → `main`)
- Descriptive title following commit format
- Description: what changed, why, how to test
- All CI checks pass (lint, typecheck, tests)
- At least 1 reviewer approval

---

## 32. Environment Configuration

### 32.1 Backend Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Dev only | `file:./dev.db` for local SQLite |
| `TURSO_DATABASE_URL` | Prod only | `libsql://skam-{id}.turso.io` |
| `TURSO_AUTH_TOKEN` | Prod only | Turso authentication token |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis auth token |
| `CLOUDFLARE_ACCOUNT_ID` | Yes | Cloudflare account for R2 |
| `R2_ACCESS_KEY_ID` | Yes | R2 S3-compatible access key |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 S3-compatible secret key |
| `R2_BUCKET_NAME` | Yes | Bucket name (`skam`) |
| `R2_ENDPOINT` | Yes | R2 S3 endpoint URL |
| `TURNSTILE_SECRET_KEY` | Yes | Cloudflare Turnstile server key |
| `NEXTAUTH_SECRET` | Yes | Shared with frontend NextAuth |
| `ADMIN_WHITELIST` | Yes | Comma-separated GitHub usernames |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth app secret |

### 32.2 Frontend Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Yes | Turnstile site key |
| `NEXTAUTH_URL` | Yes | Frontend base URL |
| `NEXTAUTH_SECRET` | Yes | Must match backend |
| `GITHUB_CLIENT_ID` | Yes | Same as backend |
| `GITHUB_CLIENT_SECRET` | Yes | Same as backend |

### 32.3 Critical Rules

**Rule 16.** NEVER commit `.env` files. Use `.env.example` as template.

**Rule 17.** NEVER expose secrets in `NEXT_PUBLIC_` variables. Only `TURNSTILE_SITE_KEY` and `API_URL` are public.

**Rule 18.** USE VERCEL ENVIRONMENT VARIABLES for production. Set via Dashboard.

---

## 33. Testing Strategy

### 33.1 Backend

| Test Type | Tool | Coverage |
|---|---|---|
| Unit Tests | `bun:test` | Services: 80% minimum |
| Integration | `bun:test` + Supertest | All API endpoints |
| E2E | `bun:test` + Supertest | Search, submit, approve flows |

### 33.2 Frontend

| Test Type | Tool | Coverage |
|---|---|---|
| Component | Vitest + React Testing Library | All interactive components |
| E2E | Playwright | Search, report, admin flows |
| Visual Regression | Playwright screenshots | Key pages across viewports |

### 33.3 Testing Rules

**Rule 19.** Every service method must have at least one happy-path test and one error test.

**Rule 20.** Every API endpoint must have an integration test verifying status code, response shape, and auth.

**Rule 21.** Mock external services (Turso, Redis, R2, Turnstile) in tests. Never hit real services in CI.

**Rule 22.** Include tests with Vietnamese characters to catch encoding issues.

---

## 34. Deployment Pipeline

### 34.1 Vercel

- Push to `main` → production deploy (both apps)
- Every PR → unique preview URL
- Backend build: `bun run build:api`
- Frontend build: `bun run build:web`

### 34.2 Database Migrations

1. Create locally: `bun run db:migrate -- --name {name}`
2. Review SQL in `prisma/migrations/{timestamp}/migration.sql`
3. Apply to Turso: `turso db shell skam < prisma/migrations/{latest}/migration.sql`
4. Verify: `turso db shell skam --execute "SELECT name FROM sqlite_master WHERE type='table'"`

### 34.3 Deployment Checklist

**Rule 23.** All CI checks pass (lint, typecheck, tests).

**Rule 24.** Environment variables verified in Vercel Dashboard.

**Rule 25.** Database migrations applied to Turso production.

**Rule 26.** Redis cache cleared if schema changed.

**Rule 27.** Health endpoint verified: `GET /api/v1/health`.

---

## 35. Security Checklist

**Rule 28.** VALIDATE ALL INPUT: Every endpoint must validate via DTOs. Sanitize HTML to prevent XSS.

**Rule 29.** PARAMETERIZED QUERIES: Prisma handles this. NEVER use raw SQL with string concatenation.

**Rule 30.** CORS: Only allow specific frontend domain. No wildcard origins in production.

**Rule 31.** RATE LIMITING: Every public endpoint must have rate limiting via Upstash Redis.

**Rule 32.** FILE VALIDATION: Check file type by magic bytes (not just extension). Limit sizes server-side.

**Rule 33.** HASH SENSITIVE DATA: IP addresses and fingerprints SHA-256 hashed with server-side salt (in env vars).

**Rule 34.** ADMIN AUTH: JWT verified server-side. Whitelist checked every request. 24-hour max JWT expiry.

**Rule 35.** DEPENDENCY AUDIT: Run `bun pm audit` weekly. Update security patches immediately.

**Rule 36.** SECURITY HEADERS: CSP, X-Frame-Options, X-Content-Type-Options, HSTS on all responses.

**Rule 37.** NO SENSITIVE LOGS: Never log tokens, passwords, hashes, or full request bodies.

---

## 36. Performance Guidelines

**Rule 38.** CACHE FIRST: Every read endpoint checks Redis before Turso. Target <20% cache miss ratio.

**Rule 39.** DATABASE INDEXES: Indexes on all WHERE clause fields. Monitor slow queries.

**Rule 40.** IMAGE OPTIMIZATION: Next.js `<Image>` with width/height. WebP format. Lazy load below fold.

**Rule 41.** BUNDLE SIZE: Keep initial JS <100KB. Code-split admin routes. Monitor with `next build --analyze`.

**Rule 42.** API RESPONSE TIME: Target <200ms (cache hit), <500ms (cache miss). Monitor with Vercel Analytics.

**Rule 43.** PAGINATION: All list endpoints paginated. Default 10, max 50. Never unbounded results.

**Rule 44.** MOBILE OPTIMIZATION: Test on 3G throttle. LCP <2.5s. CLS <0.1. Skeleton loaders everywhere.

**Rule 45.** PRESIGNED UPLOADS: Direct-to-R2 via presigned URLs. Hash dedup. Show progress.

**Rule 46.** CONNECTION POOLING: Single PrismaClient per serverless instance. Turso handles edge pooling.

---

> **END OF DOCUMENT**
>
> SKAM Platform v2.0 | Full System Documentation | March 2026
>
> Total Rules: 46 | Total Sections: 36
