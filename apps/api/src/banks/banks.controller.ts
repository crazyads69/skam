import { Controller, Get, HttpException, Query, Req } from '@nestjs/common'
import type { ApiResponse } from '@skam/shared/src/types'
import { CacheService } from '../cache/cache.service'
import { BanksService } from './banks.service'

interface RequestLike {
  ip?: string
  headers: Record<string, string | string[] | undefined>
}

@Controller('banks')
export class BanksController {
  public constructor(
    private readonly banksService: BanksService,
    private readonly cacheService: CacheService
  ) {}

  @Get()
  public async listBanks(@Req() request: RequestLike): Promise<ApiResponse<Awaited<ReturnType<BanksService['listBanks']>>>> {
    await this.enforceReadLimit(request)
    const data = await this.banksService.listBanks()
    return { success: true, data }
  }

  @Get('search')
  public async searchBanks(
    @Req() request: RequestLike,
    @Query('q') query: string
  ): Promise<ApiResponse<Awaited<ReturnType<BanksService['searchBanks']>>>> {
    await this.enforceReadLimit(request)
    const data = await this.banksService.searchBanks(query ?? '')
    return { success: true, data }
  }

  private async enforceReadLimit(request: RequestLike): Promise<void> {
    const forwardedFor: string | string[] | undefined = request.headers['x-forwarded-for']
    const identifier: string =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim() ?? request.ip ?? 'unknown'
        : request.ip ?? 'unknown'
    const allowed: boolean = await this.cacheService.fixedWindowLimit(`ratelimit:banks:${identifier}`, 100, 60)
    if (!allowed) throw new HttpException('Vượt giới hạn truy vấn', 429)
  }
}
