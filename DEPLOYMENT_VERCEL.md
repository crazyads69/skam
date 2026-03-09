# Vercel Deployment Guide

## Architecture
- Deploy API as one Vercel project with Root Directory: `apps/api`
- Deploy Web as one Vercel project with Root Directory: `apps/web`
- Set `NEXT_PUBLIC_API_URL` in Web project to the API project URL

## API Project
- Root Directory: `apps/api`
- Framework Preset: NestJS
- Uses NestJS native Vercel function entry from `src/main.ts`
- Keep `apps/api/vercel.json` only for Bun runtime pinning

### Required API Environment Variables
- `DATABASE_URL`
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `CORS_ORIGIN`
- `HASH_SALT`
- `TURNSTILE_SECRET_KEY`
- `ADMIN_WHITELIST`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL`
- `VIETQR_BANKS_URL`
- `VIETQR_TIMEOUT_MS`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_ENDPOINT`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_API_BASE_URL`
- `TELEGRAM_NOTIFY_ON_NEW_CASE`

## Web Project
- Root Directory: `apps/web`
- Framework Preset: Next.js
- Uses `apps/web/vercel.json`

### Required Web Environment Variables
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

## Telegram Notifications
- New case submissions trigger Telegram notification in API service.
- If `TELEGRAM_BOT_TOKEN` or `TELEGRAM_CHAT_ID` is missing, notifications are skipped.
- Use channel chat id format like `-100xxxxxxxxxx`.
