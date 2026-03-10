# SKAM Platform

Vietnam-focused anti-scam platform for bank account lookup, community scam reporting, and admin moderation.

This repository is a Bun monorepo with:
- `apps/web`: Next.js 16 App Router frontend
- `apps/api`: NestJS 10 backend API
- `packages/shared`: shared types, schemas, constants, and utilities

The system helps users:
- Search known scam-related bank identifiers
- Submit new scam reports with optional evidence uploads
- View approved public cases and profiles
- Let admins moderate, approve, reject, and refine reports

---

## Table of Contents

- [1. Features](#1-features)
- [2. Tech Stack](#2-tech-stack)
- [3. Prerequisites](#3-prerequisites)
- [4. Quick Start](#4-quick-start)
- [5. Installation](#5-installation)
- [6. Configuration](#6-configuration)
- [7. Environment Variables](#7-environment-variables)
- [8. Usage and Getting Started Tutorial](#8-usage-and-getting-started-tutorial)
- [9. Project Structure](#9-project-structure)
- [10. API Documentation](#10-api-documentation)
- [11. Development Workflow](#11-development-workflow)
- [12. Testing and Quality](#12-testing-and-quality)
- [13. Deployment](#13-deployment)
- [14. Dependencies](#14-dependencies)
- [15. Contributing](#15-contributing)
- [16. Troubleshooting](#16-troubleshooting)
- [17. License](#17-license)
- [18. Support and Contact](#18-support-and-contact)
- [19. Additional Documentation](#19-additional-documentation)

---

## 1. Features

- Public bank-account search against approved scam cases
- Public case detail pages with evidence access flow
- Public profile pages aggregating account history
- Multi-step report submission with file upload flow
- Optional Cloudflare Turnstile anti-abuse checks
- Admin authentication via GitHub OAuth + whitelist
- Admin moderation workflow:
  - list cases
  - approve / reject / refine
  - delete
  - analytics overview
- Rate limiting, validation, and security middleware on API
- Shared type contracts between frontend and backend

---

## 2. Tech Stack

### Frontend (`apps/web`)
- Next.js `^16.1.0`
- React `^19.1.0`
- Tailwind CSS `^4.1.13`
- React Hook Form + Zod
- Lucide icons

### Backend (`apps/api`)
- NestJS `^10.4.0`
- Prisma `^7.4.0` (`@prisma/client`, `@prisma/adapter-libsql`)
- libSQL/Turso support
- Upstash Redis support for caching/rate-limiting integration
- AWS S3 SDK compatible storage flow (Cloudflare R2 target)
- Passport GitHub OAuth

### Shared (`packages/shared`)
- Shared TypeScript types, schemas, constants, utilities

### Tooling
- Bun workspace monorepo
- TypeScript `^5.7.0`
- Prettier + ESLint

---

## 3. Prerequisites

Minimum requirements:
- macOS, Linux, or WSL-compatible environment
- Bun `1.x`
- Git

Recommended:
- Node.js `20+` (for ecosystem compatibility tools, optional if Bun-only)
- Vercel account (for production deployment)
- Cloudflare account (R2 + Turnstile) for production upload and anti-bot setup
- GitHub OAuth app credentials for admin auth

Check installed versions:

```bash
bun --version
git --version
```

---

## 4. Quick Start

```bash
git clone <your-fork-or-repo-url> skam
cd skam
bun install
cp .env.example .env

# In one terminal
bun run dev:api

# In another terminal
bun run dev:web
```

Open:
- Web: `http://localhost:3000`
- API health: `http://localhost:4000/api/v1/health`

---

## 5. Installation

### Step 1: Clone repository

```bash
git clone <your-fork-or-repo-url> skam
cd skam
```

### Step 2: Install dependencies

```bash
bun install
```

### Step 3: Prepare environment file

```bash
cp .env.example .env
```

### Step 4: Setup database schema

For local development with sqlite/libsql path from `DATABASE_URL`:

```bash
bun run db:migrate
```

Alternative push flow:

```bash
bun run db:push
```

### Step 5: Start services

Run both services separately:

```bash
bun run dev:api
bun run dev:web
```

Or use root workspace command:

```bash
bun run dev
```

---

## 6. Configuration

This project uses a single root `.env` file. Both `apps/api` and `apps/web` read relevant variables.

Configuration priorities:
1. `.env` for local
2. Platform environment variables for deployment

Key setup order:
1. Database (`DATABASE_URL` or Turso vars)
2. CORS and API URL (`CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`)
3. Auth (`ADMIN_WHITELIST`, GitHub OAuth vars)
4. Storage (`R2_*` vars)
5. Anti-bot (`TURNSTILE_*`)
6. Optional notifications (Telegram vars)

---

## 7. Environment Variables

Source of truth: `.env.example`.

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Yes (local) | Prisma/libsql DB URL for local/dev | `file:./dev.db` |
| `NEXT_PUBLIC_API_URL` | Yes | Web app API base URL (include `/api/v1`) | `http://localhost:4000/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical public site URL for metadata, robots, and sitemap | `http://localhost:3000` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional | Turnstile site key for frontend widget | `...` |
| `NEXTAUTH_URL` | Recommended | App base URL used in auth-related flows | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Recommended | Secret for auth/session integrations | `...` |
| `CORS_ORIGIN` | Yes | Allowed web origins for API CORS | `http://localhost:3000` |
| `HASH_SALT` | Recommended | Salt used in hashing sensitive fingerprints | `...` |
| `REQUIRE_HASH_SALT` | Optional | Enforce non-empty `HASH_SALT` | `false` |
| `TURSO_DATABASE_URL` | Optional | Turso remote database URL | `libsql://...` |
| `TURSO_AUTH_TOKEN` | Optional | Turso auth token | `...` |
| `UPSTASH_REDIS_REST_URL` | Optional | Upstash Redis REST endpoint | `https://...` |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash Redis token | `...` |
| `CLOUDFLARE_ACCOUNT_ID` | Optional | Cloudflare account ID | `...` |
| `R2_ACCESS_KEY_ID` | Optional | Cloudflare R2 access key | `...` |
| `R2_SECRET_ACCESS_KEY` | Optional | Cloudflare R2 secret key | `...` |
| `R2_BUCKET_NAME` | Optional | Bucket for evidence files | `skam` |
| `R2_ENDPOINT` | Optional | S3-compatible endpoint for R2 | `https://...r2.cloudflarestorage.com` |
| `TURNSTILE_SECRET_KEY` | Optional | Server-side Turnstile secret | `...` |
| `TURNSTILE_ALLOW_BYPASS` | Optional | Allow bypass behavior in specific envs | `true` |
| `TURNSTILE_TIMEOUT_MS` | Optional | Turnstile verification timeout | `5000` |
| `ADMIN_WHITELIST` | Yes (admin) | Comma-separated GitHub usernames allowed as admin | `user1,user2` |
| `GITHUB_CLIENT_ID` | Yes (admin auth) | GitHub OAuth app client ID | `...` |
| `GITHUB_CLIENT_SECRET` | Yes (admin auth) | GitHub OAuth app secret | `...` |
| `GITHUB_CALLBACK_URL` | Yes (admin auth) | OAuth callback URL to API | `http://localhost:4000/api/v1/auth/github/callback` |
| `VIETQR_BANKS_URL` | Optional | Banks datasource endpoint | `https://api.vietqr.io/v2/banks` |
| `VIETQR_TIMEOUT_MS` | Optional | Banks API timeout | `5000` |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram bot token for notifications | `...` |
| `TELEGRAM_CHAT_ID` | Optional | Telegram channel/chat ID | `-100xxxxxxxxxx` |
| `TELEGRAM_API_BASE_URL` | Optional | Telegram API base URL | `https://api.telegram.org` |
| `TELEGRAM_NOTIFY_ON_NEW_CASE` | Optional | Enable notification on new case | `true` |
| `TRUST_PROXY_HEADERS` | Optional | Trust reverse proxy forwarded headers | `false` |

Security note:
- Never commit real secrets.
- Use platform secret management for production.

---

## 8. Usage and Getting Started Tutorial

### End-user flow (public)

1. Open home page (`/`)
2. Search a bank identifier or scammer keyword
3. Open a case detail page from results
4. Submit a new report at `/report` with:
   - account info
   - incident details
   - optional social links
   - optional evidence files

### Admin flow

1. Open `/admin/login`
2. Authenticate via GitHub OAuth
3. Ensure account exists in `ADMIN_WHITELIST`
4. Access:
   - `/admin`: dashboard + analytics + pending items
   - `/admin/cases`: moderation list
   - `/admin/cases/:id`: review and actions

### API usage example

Search cases:

```bash
curl "http://localhost:4000/api/v1/cases/search?q=123456&page=1&pageSize=10"
```

Get case details:

```bash
curl "http://localhost:4000/api/v1/cases/<case-id>"
```

Create a report:

```bash
curl -X POST "http://localhost:4000/api/v1/cases" \
  -H "Content-Type: application/json" \
  -d '{
    "bankIdentifier":"0123456789",
    "bankName":"NGUYEN VAN A",
    "bankCode":"VCB",
    "originalDescription":"Nội dung mô tả vụ việc tối thiểu 50 ký tự...",
    "amount": 5000000
  }'
```

---

## 9. Project Structure

```text
skam/
├─ apps/
│  ├─ api/                  # NestJS backend
│  │  ├─ prisma/            # Prisma schema + migrations
│  │  └─ src/
│  │     ├─ admin/          # Moderation and admin analytics
│  │     ├─ auth/           # GitHub OAuth + admin guard
│  │     ├─ banks/          # Bank datasource endpoints
│  │     ├─ cases/          # Public case create/search/detail
│  │     ├─ profiles/       # Public aggregated profile lookups
│  │     ├─ storage/        # Evidence upload/view URL flows
│  │     ├─ analytics/      # Public summary endpoint
│  │     └─ ...
│  └─ web/                  # Next.js App Router frontend
│     ├─ app/               # Routes (public/admin/api)
│     ├─ components/        # UI + feature components
│     └─ lib/               # API client and helpers
├─ packages/
│  └─ shared/               # Shared types/constants/schemas
├─ .env.example
├─ DEPLOYMENT_VERCEL.md
├─ SKAM-DESIGN-SYSTEM.md
└─ SKAM_Platform_Full_Documentation.md
```

---

## 10. API Documentation

Base URL:
- Local: `http://localhost:4000/api/v1`

### Public endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Service health check |
| `GET` | `/banks` | List banks |
| `GET` | `/banks/search?q=` | Search banks |
| `POST` | `/cases` | Submit a scam report |
| `GET` | `/cases/search` | Search approved scam cases |
| `GET` | `/cases/recent` | List recent approved cases |
| `GET` | `/cases/:id` | Get approved case detail |
| `GET` | `/profiles/:identifier` | Get aggregated profile by identifier |
| `GET` | `/analytics/summary` | Public platform summary |
| `POST` | `/upload/presign` | Request upload presigned URL |
| `POST` | `/upload/public-view-url` | Get public evidence view URL |

### Auth endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/auth/github` | Start GitHub OAuth |
| `GET` | `/auth/github/callback` | GitHub OAuth callback |
| `GET` | `/auth/me` | Get current admin identity |
| `POST` | `/auth/logout` | Logout action |

### Admin endpoints (requires admin token)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/admin/cases` | List cases |
| `GET` | `/admin/cases/pending` | List pending cases |
| `GET` | `/admin/cases/:id` | Case detail |
| `PATCH` | `/admin/cases/:id/approve` | Approve case |
| `PATCH` | `/admin/cases/:id/reject` | Reject case |
| `PATCH` | `/admin/cases/:id/refine` | Refine content |
| `DELETE` | `/admin/cases/:id` | Delete case |
| `POST` | `/admin/banks/refresh` | Refresh bank cache/data |
| `GET` | `/admin/analytics` | Admin analytics |

Auth mode:
- Admin endpoints use bearer token validation plus whitelist checks.

---

## 11. Development Workflow

### Run commands from repository root

```bash
# Start everything
bun run dev

# Start specific apps
bun run dev:api
bun run dev:web

# Build
bun run build
bun run build:api
bun run build:web

# Type checking
bun run typecheck

# Test
bun run test
```

### Database workflow

```bash
bun run db:migrate
bun run db:push
bun run db:studio
```

---

## 12. Testing and Quality

Current test scripts:
- API:
  - unit/integration entry: `bun run --cwd apps/api test`
  - e2e: `bun run --cwd apps/api test:e2e`
- Web:
  - current script is placeholder (`web tests skipped`)

Recommended verification before PR:

```bash
bun run --cwd apps/api typecheck
bun run --cwd apps/api test:e2e
bun run --cwd apps/api build
bun run --cwd apps/web typecheck
bun run --cwd apps/web build
```

Lint status:
- Lint scripts currently stubbed (`lint skipped`) in workspaces.

---

## 13. Deployment

Detailed guide: `DEPLOYMENT_VERCEL.md`.

### Recommended production architecture

- Deploy API as one Vercel project with root `apps/api`
- Deploy Web as one Vercel project with root `apps/web`
- Configure `NEXT_PUBLIC_API_URL` in web project to API deployment URL

### High-level deploy steps

1. Create two Vercel projects:
   - API project -> root directory `apps/api`
   - Web project -> root directory `apps/web`
2. Configure all required env vars in each project
3. Deploy API first
4. Point web `NEXT_PUBLIC_API_URL` to API URL
5. Deploy web
6. Validate:
   - web home route
   - API `/api/v1/health`
   - admin OAuth callback path

---

## 14. Dependencies

### Root (selected)
- `typescript`: `^5.7.0`
- `eslint`: `^9.17.0`
- `prettier`: `^3.4.0`

### API (selected runtime)
- `@nestjs/common`: `^10.4.0`
- `@nestjs/core`: `^10.4.0`
- `@prisma/client`: `^7.4.0`
- `@aws-sdk/client-s3`: `^3.887.0`
- `@upstash/redis`: `^1.35.6`
- `jose`: `^6.1.0`

### Web (selected runtime)
- `next`: `^16.1.0`
- `react`: `^19.1.0`
- `react-dom`: `^19.1.0`
- `tailwindcss`: `^4.1.13`
- `react-hook-form`: `^7.54.0`
- `zod`: `^3.24.0`

### Shared
- `zod`: `^3.24.0`

For complete dependency lists, see:
- `package.json`
- `apps/api/package.json`
- `apps/web/package.json`
- `packages/shared/package.json`

---

## 15. Contributing

There is no standalone `CONTRIBUTING.md` yet. Use this workflow:

1. Fork and create a feature branch
2. Keep changes scoped and atomic
3. Run verification commands (typecheck/build/tests)
4. Open PR with:
   - summary
   - rationale
   - verification output
   - screenshots for UI changes

Recommended branch naming:
- `feat/<short-topic>`
- `fix/<short-topic>`
- `chore/<short-topic>`

---

## 16. Troubleshooting

### API fails to start

- Check `.env` exists and `DATABASE_URL` is set
- Run:

```bash
bun run db:migrate
```

### CORS errors in browser

- Ensure `CORS_ORIGIN` includes your frontend URL
- Ensure `NEXT_PUBLIC_API_URL` points to API base path (`/api/v1`)

### Admin login loops back to login

- Verify GitHub OAuth credentials
- Verify `GITHUB_CALLBACK_URL`
- Ensure GitHub username is in `ADMIN_WHITELIST`

### Upload/evidence URL issues

- Verify all `R2_*` variables
- Confirm bucket exists and credentials have object permissions

### Turnstile validation failures

- Check `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`
- For local debugging only, adjust `TURNSTILE_ALLOW_BYPASS`

### Missing bank list

- Validate `VIETQR_BANKS_URL`
- Check outbound network access from API runtime

---

## 17. License

No license file is currently included in this repository.

Until a license is added, treat usage and redistribution as restricted by default.

---

## 18. Support and Contact

Recommended support channels:
- Open an issue in this repository for bugs and feature requests
- Include:
  - reproduction steps
  - expected vs actual behavior
  - environment details
  - logs/screenshots

For security-related reports, avoid posting secrets publicly and contact maintainers through a private channel if available.

---

## 19. Additional Documentation

- Product and implementation specification:
  - `SKAM_Platform_Full_Documentation.md`
- UI and design system:
  - `SKAM-DESIGN-SYSTEM.md`
- Deployment instructions:
  - `DEPLOYMENT_VERCEL.md`

If this README and those docs conflict, prefer runtime truth from source code and update docs in the same PR.
