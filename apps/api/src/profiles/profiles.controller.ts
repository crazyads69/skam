import { Controller, Get, Param } from '@nestjs/common'
import type { ApiResponse } from '@skam/shared/src/types'
import { ProfilesService } from './profiles.service'

@Controller('profiles')
export class ProfilesController {
  public constructor(private readonly profilesService: ProfilesService) {}

  @Get(':identifier')
  public async getByIdentifier(
    @Param('identifier') identifier: string
  ): Promise<ApiResponse<Awaited<ReturnType<ProfilesService['getByIdentifier']>>>> {
    const data = await this.profilesService.getByIdentifier(identifier)
    return { success: true, data }
  }
}
