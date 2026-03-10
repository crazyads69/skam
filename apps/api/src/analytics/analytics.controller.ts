import { Controller, Get, HttpException, Req } from '@nestjs/common'
import type { ApiResponse } from '@skam/shared/src/types'
import { CacheService } from '../cache/cache.service'
import { resolveRequestIdentifier } from '../common/request-identifier'
import { AnalyticsService } from './analytics.service'

@Controller('analytics')
export class AnalyticsController {
  public constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly cacheService: CacheService
  ) {}

  @Get('summary')
  public async getSummary(
    @Req() request: { ip?: string; headers: Record<string, string | string[] | undefined> }
  ): Promise<ApiResponse<Awaited<ReturnType<AnalyticsService['getSummary']>>>> {
    const requester: string = resolveRequestIdentifier(request)
    const allowed: boolean = await this.cacheService.fixedWindowLimit(
      `ratelimit:analytics-summary:${requester}`,
      60,
      60
    )
    if (!allowed) throw new HttpException('Vượt giới hạn truy cập thống kê', 429)
    const data = await this.analyticsService.getSummary()
    return { success: true, data }
  }
}
