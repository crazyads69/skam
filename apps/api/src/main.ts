import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  app.use(helmet())
  app.setGlobalPrefix('api/v1')
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  const corsOrigins: string[] = (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',').map((item) => item.trim())
  app.enableCors({ origin: corsOrigins })
  const port: number = Number(process.env.PORT ?? '4000')
  await app.listen(Number.isNaN(port) ? 4000 : port)
}

void bootstrap()
