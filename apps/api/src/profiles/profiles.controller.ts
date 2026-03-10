import { Controller, Get, HttpException, Param, Req } from '@nestjs/common'
import type { ApiResponse } from '@skam/shared/src/types'
import { CacheService } from '../cache/cache.service'
import { resolveRequestIdentifier } from '../common/request-identifier'
import { ProfilesService } from './profiles.service'

@Controller('profiles')
export class ProfilesController {
  public constructor(
    private readonly profilesService: ProfilesService,
    private readonly cacheService: CacheService
  ) {}

  @Get(':identifier')
  public async getByIdentifier(
    @Param('identifier') identifier: string,
    @Req() request: { ip?: string; headers: Record<string, string | string[] | undefined> }
  ): Promise<ApiResponse<Awaited<ReturnType<ProfilesService['getByIdentifier']>>>> {
    const requester: string = resolveRequestIdentifier(request)
    const allowed: boolean = await this.cacheService.fixedWindowLimit(
      `ratelimit:profile-detail:${requester}`,
      30,
      60
    )
    if (!allowed) throw new HttpException('Vượt giới hạn truy cập hồ sơ', 429)
    const data = await this.profilesService.getByIdentifier(identifier)
    return { success: true, data }
  }
}
