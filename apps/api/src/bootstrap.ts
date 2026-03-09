import type { INestApplication } from '@nestjs/common'
import { ValidationPipe } from '@nestjs/common'
import helmet from 'helmet'

export function applyAppRuntime(app: INestApplication): void {
  app.use(helmet())
  app.setGlobalPrefix('api/v1')
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  const corsOrigins: string[] = (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',').map((item) => item.trim())
  app.enableCors({ origin: corsOrigins })
}
