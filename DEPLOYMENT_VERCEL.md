# Vercel Deployment Guide

## Architecture
- Deploy API as one Vercel project with Root Directory: `apps/api`
- Deploy Web as one Vercel project with Root Directory: `apps/web`
- Set `NEXT_PUBLIC_API_URL` in Web project to the API project URL (origin is recommended, e.g. `https://api.example.com`)

## Cloudflare Proxy (Optional)
If Cloudflare sits in front of your Vercel deployment:

1. **API project env vars:**
   - `TRUST_PROXY_HEADERS=true`
   - `TRUSTED_PROXY_HEADER=cf-connecting-ip` (Cloudflare's real-IP header)
2. **Cloudflare DNS:** Set DNS records to "Proxied" (orange cloud)
3. **Cloudflare SSL:** Use "Full (strict)" SSL mode
4. **CORS_ORIGIN** must list your Cloudflare domain (e.g. `https://skam.vn`)
5. The Web CSP already allows Cloudflare Turnstile and Insights scripts

Without Cloudflare, keep the defaults:
- `TRUST_PROXY_HEADERS=true` with `TRUSTED_PROXY_HEADER=x-vercel-forwarded-for` (Vercel default)

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
- `TRUST_PROXY_HEADERS` (set to `true` for Vercel/Cloudflare)
- `TRUSTED_PROXY_HEADER` (set to `cf-connecting-ip` for Cloudflare, default: `x-vercel-forwarded-for`)
- `TURNSTILE_SECRET_KEY`
- `TURNSTILE_ALLOW_BYPASS` (set to `false` in production)
- `ADMIN_WHITELIST`
- `ADMIN_AUTH_RATE_LIMIT`
- `ADMIN_AUTH_RATE_LIMIT_WINDOW_SECONDS`
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
- `CACHE_LIMIT_FAIL_OPEN` (set to `false` in production)

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
