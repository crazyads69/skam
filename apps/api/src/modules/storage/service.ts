import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { db } from "../../db/client";
import { evidenceFiles, scamCases } from "../../db/schema";
import { cache } from "../../services/cache";
import { badRequest, serviceUnavailable } from "../../common/error";
import { eq, and } from "drizzle-orm";

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

  private readonly expiresInSeconds = 15 * 60;
  private readonly viewUrlCacheTtlSeconds = 10 * 60;
  private readonly enabled: boolean;
  private readonly bucketName: string;
  private readonly s3Client: S3Client | null;

  constructor() {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.enabled = Boolean(endpoint && accessKeyId && secretAccessKey);
    if (!this.enabled) {
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
      throw serviceUnavailable("Dịch vụ lưu trữ hiện không khả dụng");
    }
  }

  private getFileExtension(fileName: string): string {
    const index = fileName.lastIndexOf(".");
    if (index < 0 || index === fileName.length - 1) return "";
    return fileName.slice(index).toLowerCase();
  }

  async presignUpload(payload: {
    fileName: string;
    contentType: string;
    fileSize: number;
    fileHash?: string;
  }): Promise<PresignPayload> {
    this.assertEnabled();
    if (!this.allowedContentTypes.includes(payload.contentType)) {
      throw badRequest("Loại tệp không được hỗ trợ");
    }

    const normalizedFileName = payload.fileName.replace(
      /[^a-zA-Z0-9._-]/g,
      "_",
    );
    const fileExtension = this.getFileExtension(normalizedFileName);
    const allowedExtensions =
      this.allowedExtensionsByContentType[payload.contentType] ?? [];
    if (!allowedExtensions.includes(fileExtension)) {
      throw badRequest("Phần mở rộng tệp không khớp loại nội dung");
    }

    const fileKey = `evidence/${Date.now()}-${randomUUID().slice(0, 8)}-${normalizedFileName}`;
    const normalizedFileHash = payload.fileHash?.toLowerCase();
    if (normalizedFileHash && !/^[a-f0-9]{32,128}$/.test(normalizedFileHash)) {
      throw badRequest("Mã băm tệp không hợp lệ");
    }

    const dedupeKey = normalizedFileHash
      ? `dedupe:upload:${normalizedFileHash}`
      : null;
    const noHashSpamKey = `dedupe:upload:nohash:${payload.contentType}:${payload.fileSize}:${normalizedFileName.toLowerCase()}`;

    if (dedupeKey) {
      const canProceed = await cache.fixedWindowLimit(
        dedupeKey,
        1,
        this.expiresInSeconds,
      );
      if (!canProceed)
        throw badRequest("Tệp đang được xử lý, vui lòng thử lại sau");
    } else {
      const canProceed = await cache.fixedWindowLimit(noHashSpamKey, 2, 60);
      if (!canProceed) throw badRequest("Phát hiện tải lên lặp lại bất thường");
    }

    if (normalizedFileHash) {
      const [existing] = await db
        .select({ id: evidenceFiles.id })
        .from(evidenceFiles)
        .where(eq(evidenceFiles.fileHash, normalizedFileHash))
        .limit(1);
      if (existing) throw badRequest("Tệp đã tồn tại trong hệ thống");
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: payload.contentType,
      ContentLength: payload.fileSize,
    });
    const uploadUrl = await getSignedUrl(this.s3Client!, command, {
      expiresIn: this.expiresInSeconds,
      signableHeaders: new Set(["content-type"]),
    });

    return { fileKey, uploadUrl, expiresIn: this.expiresInSeconds };
  }

  async presignViewUrl(fileKey: string): Promise<ViewUrlPayload> {
    this.assertEnabled();
    if (!fileKey.startsWith("evidence/")) {
      throw badRequest("Đường dẫn tệp không hợp lệ");
    }

    const cacheKey = `presign:view:${fileKey}`;
    const cached = await cache.get<ViewUrlPayload>(cacheKey);
    if (cached) return cached;

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });
    const viewUrl = await getSignedUrl(this.s3Client!, command, {
      expiresIn: this.expiresInSeconds,
    });

    const result: ViewUrlPayload = {
      fileKey,
      viewUrl,
      expiresIn: this.expiresInSeconds,
    };
    await cache.set(cacheKey, result, this.viewUrlCacheTtlSeconds);
    return result;
  }

  async presignPublicViewUrl(
    caseId: string,
    evidenceId: string,
  ): Promise<ViewUrlPayload> {
    const [evidence] = await db
      .select({ fileKey: evidenceFiles.fileKey })
      .from(evidenceFiles)
      .where(
        and(
          eq(evidenceFiles.id, evidenceId),
          eq(evidenceFiles.caseId, caseId),
          eq(evidenceFiles.isApproved, true),
        ),
      )
      .limit(1);
    if (!evidence) throw badRequest("Không tìm thấy bằng chứng công khai");

    const [caseRow] = await db
      .select({ status: scamCases.status })
      .from(scamCases)
      .where(eq(scamCases.id, caseId))
      .limit(1);
    if (!caseRow || caseRow.status !== "APPROVED") {
      throw badRequest("Không tìm thấy bằng chứng công khai");
    }

    return this.presignViewUrl(evidence.fileKey);
  }
}

export const storageService = new StorageService();
