import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { CaseStatus } from "@skam/shared/src/types";
import { randomUUID } from "node:crypto";
import { CacheService } from "../cache/cache.service";
import { PrismaService } from "../database/prisma.service";
import { UploadPresignDto } from "./dto/upload-presign.dto";

interface PresignPayload {
  fileKey: string;
  uploadUrl: string;
  expiresIn: number;
}

interface ViewUrlPayload {
  fileKey: string;
  viewUrl: string;
  expiresIn: number;
}

@Injectable()
export class StorageService {
  private readonly allowedContentTypes: string[] = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/webm",
    "audio/mpeg",
    "audio/wav",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  private readonly allowedExtensionsByContentType: Record<string, string[]> = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "video/mp4": [".mp4"],
    "video/webm": [".webm"],
    "audio/mpeg": [".mp3"],
    "audio/wav": [".wav"],
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
  };

  private readonly logger = new Logger(StorageService.name);
  private readonly expiresInSeconds: number = 60 * 15;
  private readonly enabled: boolean;
  private readonly bucketName: string;
  private readonly s3Client: S3Client | null;

  public constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {
    const endpoint: string | undefined = process.env.R2_ENDPOINT;
    const accessKeyId: string | undefined = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey: string | undefined =
      process.env.R2_SECRET_ACCESS_KEY;
    this.enabled = Boolean(endpoint && accessKeyId && secretAccessKey);
    if (!this.enabled) {
      this.logger.warn("R2 storage not configured — uploads disabled");
      this.bucketName = "";
      this.s3Client = null;
      return;
    }
    this.bucketName = process.env.R2_BUCKET_NAME ?? "skam";
    this.s3Client = new S3Client({
      region: "auto",
      endpoint,
      forcePathStyle: false,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });
  }

  private assertEnabled(): void {
    if (!this.enabled || !this.s3Client) {
      throw new ServiceUnavailableException(
        "Dịch vụ lưu trữ hiện không khả dụng",
      );
    }
  }

  public async presignUpload(
    payload: UploadPresignDto,
  ): Promise<PresignPayload> {
    this.assertEnabled();
    if (!this.allowedContentTypes.includes(payload.contentType)) {
      throw new BadRequestException("Loại tệp không được hỗ trợ");
    }
    const normalizedFileName: string = payload.fileName.replace(
      /[^a-zA-Z0-9._-]/g,
      "_",
    );
    const fileExtension: string = this.getFileExtension(normalizedFileName);
    const allowedExtensions: string[] =
      this.allowedExtensionsByContentType[payload.contentType] ?? [];
    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        "Phần mở rộng tệp không khớp loại nội dung",
      );
    }
    const fileKey: string = `evidence/${Date.now()}-${randomUUID().slice(0, 8)}-${normalizedFileName}`;
    const normalizedFileHash: string | undefined =
      payload.fileHash?.toLowerCase();
    if (normalizedFileHash && !/^[a-f0-9]{32,128}$/.test(normalizedFileHash)) {
      throw new BadRequestException("Mã băm tệp không hợp lệ");
    }
    const dedupeKey: string | null = normalizedFileHash
      ? `dedupe:upload:${normalizedFileHash}`
      : null;
    const noHashSpamKey: string = `dedupe:upload:nohash:${payload.contentType}:${payload.fileSize}:${normalizedFileName.toLowerCase()}`;
    await this.enforceUploadDedup(dedupeKey, noHashSpamKey, normalizedFileHash);
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: payload.contentType,
      ContentLength: payload.fileSize,
    });
    const uploadUrl: string = await getSignedUrl(this.s3Client!, command, {
      expiresIn: this.expiresInSeconds,
      signableHeaders: new Set(["content-type"]),
    });
    return {
      fileKey,
      uploadUrl,
      expiresIn: this.expiresInSeconds,
    };
  }

  private async enforceUploadDedup(
    dedupeKey: string | null,
    noHashSpamKey: string,
    normalizedFileHash: string | undefined,
  ): Promise<void> {
    if (dedupeKey) {
      const canProceed = await this.cache.fixedWindowLimit(
        dedupeKey,
        1,
        this.expiresInSeconds,
      );
      if (!canProceed) {
        throw new BadRequestException(
          "Tệp đang được xử lý, vui lòng thử lại sau",
        );
      }
    } else {
      const canProceed = await this.cache.fixedWindowLimit(
        noHashSpamKey,
        2,
        60,
      );
      if (!canProceed) {
        throw new BadRequestException("Phát hiện tải lên lặp lại bất thường");
      }
    }
    if (normalizedFileHash) {
      const existingCount = await this.prisma.evidenceFile.count({
        where: { fileHash: normalizedFileHash },
      });
      if (existingCount > 0) {
        throw new BadRequestException("Tệp đã tồn tại trong hệ thống");
      }
    }
  }

  private readonly viewUrlCacheTtlSeconds: number = 10 * 60; // 10 min (under 15 min S3 expiry)

  public async presignViewUrl(fileKey: string): Promise<ViewUrlPayload> {
    this.assertEnabled();
    if (!fileKey.startsWith("evidence/")) {
      throw new BadRequestException("Đường dẫn tệp không hợp lệ");
    }
    const cacheKey: string = `presign:view:${fileKey}`;
    const cached: ViewUrlPayload | null =
      await this.cache.get<ViewUrlPayload>(cacheKey);
    if (cached) return cached;
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });
    const viewUrl: string = await getSignedUrl(this.s3Client!, command, {
      expiresIn: this.expiresInSeconds,
    });
    const result: ViewUrlPayload = {
      fileKey,
      viewUrl,
      expiresIn: this.expiresInSeconds,
    };
    await this.cache.set(cacheKey, result, this.viewUrlCacheTtlSeconds);
    return result;
  }

  public async presignPublicViewUrl(
    caseId: string,
    evidenceId: string,
  ): Promise<ViewUrlPayload> {
    const found = await this.prisma.evidenceFile.findFirst({
      where: {
        id: evidenceId,
        caseId,
        isApproved: true,
        case: {
          status: CaseStatus.APPROVED,
        },
      },
      select: { fileKey: true },
    });
    if (!found) {
      throw new BadRequestException("Không tìm thấy bằng chứng công khai");
    }
    return this.presignViewUrl(found.fileKey);
  }

  private getFileExtension(fileName: string): string {
    const index: number = fileName.lastIndexOf(".");
    if (index < 0 || index === fileName.length - 1) return "";
    return fileName.slice(index).toLowerCase();
  }
}
