import {
  Body,
  Controller,
  HttpException,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { ApiResponse } from "@skam/shared/src/types";
import { AdminGuard } from "../auth/guards/admin.guard";
import { CacheService } from "../cache/cache.service";
import { assertAllowedWriteOrigin } from "../common/request-origin";
import { resolveRequestIdentifier } from "../common/request-identifier";
import { PublicViewUrlDto } from "./dto/public-view-url.dto";
import { UploadPresignDto } from "./dto/upload-presign.dto";
import { ViewUrlDto } from "./dto/view-url.dto";
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
    @Req()
    request: {
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    },
  ): Promise<
    ApiResponse<Awaited<ReturnType<StorageService["presignUpload"]>>>
  > {
    assertAllowedWriteOrigin(request.headers);
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

  @Post("view-url")
  @UseGuards(AdminGuard)
  public async presignViewUrl(
    @Body() payload: ViewUrlDto,
    @Req()
    request: {
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    },
  ): Promise<
    ApiResponse<Awaited<ReturnType<StorageService["presignViewUrl"]>>>
  > {
    const identifier: string = resolveRequestIdentifier(request);
    const allowed: boolean = await this.cacheService.fixedWindowLimit(
      `ratelimit:admin-upload-view:${identifier}`,
      120,
      60,
    );
    if (!allowed) {
      throw new HttpException("Vượt giới hạn truy cập tệp", 429);
    }
    const data = await this.storageService.presignViewUrl(payload.fileKey);
    return { success: true, data };
  }

  @Post("public-view-url")
  public async presignPublicViewUrl(
    @Body() payload: PublicViewUrlDto,
    @Req()
    request: {
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    },
  ): Promise<
    ApiResponse<Awaited<ReturnType<StorageService["presignPublicViewUrl"]>>>
  > {
    const identifier: string = resolveRequestIdentifier(request);
    const allowed: boolean = await this.cacheService.fixedWindowLimit(
      `ratelimit:public-evidence-view:${identifier}`,
      60,
      60,
    );
    if (!allowed) {
      throw new HttpException("Vượt giới hạn truy cập bằng chứng", 429);
    }
    const data = await this.storageService.presignPublicViewUrl(
      payload.caseId,
      payload.evidenceId,
    );
    return { success: true, data };
  }
}
