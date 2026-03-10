import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { CacheService } from '../cache/cache.service'
import { PrismaService } from '../database/prisma.service'

interface HealthResponse {
  status: 'ok'
  service: string
  timestamp: string
}

interface ReadyResponse extends HealthResponse {
  checks: {
    database: 'ok' | 'error'
    cache: 'ok' | 'error' | 'disabled'
  }
}

@Controller('health')
export class HealthController {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  @Get()
  public getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: '@skam/api',
      timestamp: new Date().toISOString()
    }
  }

  @Get('ready')
  public async getReady(): Promise<ReadyResponse> {
    const cache = await this.cache.healthcheck()
    let databaseOk: boolean = true
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1')
    } catch {
      databaseOk = false
    }
    const cacheStatus: 'ok' | 'error' | 'disabled' = cache.enabled
      ? cache.ok
        ? 'ok'
        : 'error'
      : 'disabled'
    if (!databaseOk || (cache.enabled && !cache.ok)) {
      throw new ServiceUnavailableException({
        status: 'error',
        service: '@skam/api',
        timestamp: new Date().toISOString(),
        checks: {
          database: databaseOk ? 'ok' : 'error',
          cache: cacheStatus
        }
      })
    }
    return {
      status: 'ok',
      service: '@skam/api',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        cache: cacheStatus
      }
    }
  }
}
