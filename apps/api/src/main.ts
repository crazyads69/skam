import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { applyAppRuntime } from './bootstrap'

function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== 'production') return
  const required: string[] = [
    'NEXTAUTH_SECRET',
    'CORS_ORIGIN',
    'ADMIN_WHITELIST',
    'TURNSTILE_SECRET_KEY',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'GITHUB_CALLBACK_URL'
  ]
  const missing: string[] = required.filter((key) => !String(process.env[key] ?? '').trim())
  const hasDatabaseUrl: boolean = Boolean(String(process.env.DATABASE_URL ?? '').trim())
  const hasTurso: boolean =
    Boolean(String(process.env.TURSO_DATABASE_URL ?? '').trim()) &&
    Boolean(String(process.env.TURSO_AUTH_TOKEN ?? '').trim())
  if (!hasDatabaseUrl && !hasTurso) {
    missing.push('DATABASE_URL or TURSO_DATABASE_URL+TURSO_AUTH_TOKEN')
  }
  if (missing.length > 0) {
    throw new Error(`Missing required production env: ${missing.join(', ')}`)
  }
}

async function bootstrap(): Promise<void> {
  assertProductionEnv()
  const app = await NestFactory.create(AppModule)
  applyAppRuntime(app)
  app.enableShutdownHooks()
  const port: number = Number(process.env.PORT ?? '4000')
  await app.listen(Number.isNaN(port) ? 4000 : port)
}

void bootstrap()
