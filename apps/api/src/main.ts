import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { applyAppRuntime } from './bootstrap'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  applyAppRuntime(app)
  const port: number = Number(process.env.PORT ?? '4000')
  await app.listen(Number.isNaN(port) ? 4000 : port)
}

void bootstrap()
