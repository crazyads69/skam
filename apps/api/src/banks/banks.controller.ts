import { Controller, Get, Header, HttpException, Query, Req } from '@nestjs/common'
import type { ApiResponse } from '@skam/shared/src/types'
import { resolveRequestIdentifier } from '../common/request-identifier'
import { CacheService } from '../cache/cache.service'
import { BanksService } from './banks.service'

@Controller('banks')
export class BanksController {
  public constructor(
    private readonly banksService: BanksService,
    private readonly cacheService: CacheService
  ) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  public async listBanks(@Req() request: { ip?: string; headers: Record<string, string | string[] | undefined> }): Promise<ApiResponse<Awaited<ReturnType<BanksService['listBanks']>>>> {
    await this.enforceReadLimit(request)
    const data = await this.banksService.listBanks()
    return { success: true, data }
  }

  @Get('search')
  public async searchBanks(
    @Req() request: { ip?: string; headers: Record<string, string | string[] | undefined> },
    @Query('q') query: string
  ): Promise<ApiResponse<Awaited<ReturnType<BanksService['searchBanks']>>>> {
    await this.enforceReadLimit(request)
    const q: string = (query ?? '').trim()
    if (q.length < 1) {
      const data = await this.banksService.listBanks()
      return { success: true, data }
    }
    const data = await this.banksService.searchBanks(q)
    return { success: true, data }
  }

  private async enforceReadLimit(request: { ip?: string; headers: Record<string, string | string[] | undefined> }): Promise<void> {
    const identifier: string = resolveRequestIdentifier(request)
    const allowed: boolean = await this.cacheService.fixedWindowLimit(`ratelimit:banks:${identifier}`, 100, 60)
    if (!allowed) throw new HttpException('Vượt giới hạn truy vấn', 429)
  }
}
