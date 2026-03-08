import { Body, Controller, HttpException, Post, Req } from "@nestjs/common";
import type { ApiResponse } from "@skam/shared/src/types";
import { CacheService } from "../cache/cache.service";
import { UploadPresignDto } from "./dto/upload-presign.dto";
import { StorageService } from "./storage.service";

interface RequestLike {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}

@Controller("upload")
export class StorageController {
  public constructor(
    private readonly storageService: StorageService,
    private readonly cacheService: CacheService,
  ) {}

  @Post("presign")
  public async presign(
    @Body() payload: UploadPresignDto,
    @Req() request: RequestLike,
  ): Promise<
    ApiResponse<Awaited<ReturnType<StorageService["presignUpload"]>>>
  > {
    const forwardedFor: string | string[] | undefined =
      request.headers["x-forwarded-for"];
    const identifier: string =
      typeof forwardedFor === "string"
        ? (forwardedFor.split(",")[0]?.trim() ?? request.ip ?? "unknown")
        : (request.ip ?? "unknown");
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
