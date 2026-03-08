import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { UploadPresignDto } from './dto/upload-presign.dto'

interface PresignPayload {
  fileKey: string
  uploadUrl: string
  expiresIn: number
}

@Injectable()
export class StorageService {
  private readonly allowedContentTypes: string[] = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  private readonly expiresInSeconds: number = 60 * 15

  public constructor(private readonly prisma: PrismaService) {}

  public async presignUpload(payload: UploadPresignDto): Promise<PresignPayload> {
    if (!this.allowedContentTypes.includes(payload.contentType)) {
      throw new BadRequestException('Loại tệp không được hỗ trợ')
    }
    const normalizedFileName: string = payload.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileKey: string = `evidence/${Date.now()}-${normalizedFileName}`
    if (payload.fileHash) {
      const existingCount: number = await this.prisma.evidenceFile.count({
        where: { fileHash: payload.fileHash }
      })
      if (existingCount > 0) {
        throw new BadRequestException('Tệp đã tồn tại trong hệ thống')
      }
    }
    const bucketName: string = process.env.R2_BUCKET_NAME ?? 'skam'
    const endpoint: string | undefined = process.env.R2_ENDPOINT
    const accessKeyId: string | undefined = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey: string | undefined = process.env.R2_SECRET_ACCESS_KEY
    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new BadRequestException('Thiếu cấu hình lưu trữ R2')
    }
    const client: S3Client = new S3Client({
      region: 'auto',
      endpoint,
      forcePathStyle: false,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    })
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: payload.contentType,
      ContentLength: payload.fileSize
    })
    const uploadUrl: string = await getSignedUrl(client, command, {
      expiresIn: this.expiresInSeconds,
      signableHeaders: new Set(['content-type'])
    })
    return {
      fileKey,
      uploadUrl,
      expiresIn: this.expiresInSeconds
    }
  }
}
