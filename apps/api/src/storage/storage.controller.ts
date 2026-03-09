import { Body, Controller, HttpException, Post, Req } from "@nestjs/common";
import type { ApiResponse } from "@skam/shared/src/types";
import { CacheService } from "../cache/cache.service";
import { resolveRequestIdentifier } from "../common/request-identifier";
import { UploadPresignDto } from "./dto/upload-presign.dto";
import { StorageService } from "./storage.service";

@Controller("upload")
export class StorageController {
  public constructor(
    private readonly storageService: StorageService,
    private readonly cacheService: CacheService,
  ) {}

  @Post("presign")
  public async presign(
    @Body() payload: UploadPresignDto,
    @Req() request: { ip?: string; headers: Record<string, string | string[] | undefined> },
  ): Promise<
    ApiResponse<Awaited<ReturnType<StorageService["presignUpload"]>>>
  > {
    const identifier: string = resolveRequestIdentifier(request);
    const allowed: boolean = await this.cacheService.fixedWindowLimit(
      `ratelimit:upload:${identifier}`,
      10,
      60,
    );
    if (!allowed) {
      throw new HttpException("Vượt giới hạn tải lên", 429);
    }
    const data = await this.storageService.presignUpload(payload);
    return { success: true, data };
  }
}
