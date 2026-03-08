import { Controller, Get } from '@nestjs/common'
import type { ApiResponse } from '@skam/shared/src/types'
import { AnalyticsService } from './analytics.service'

@Controller('analytics')
export class AnalyticsController {
  public constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  public async getSummary(): Promise<ApiResponse<Awaited<ReturnType<AnalyticsService['getSummary']>>>> {
    const data = await this.analyticsService.getSummary()
    return { success: true, data }
  }
}
