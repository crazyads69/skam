import { IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator'

export class UploadPresignDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  public fileName!: string

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  public contentType!: string

  @IsNumber()
  @Min(1)
  @Max(100 * 1024 * 1024)
  public fileSize!: number

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  public fileHash?: string
}
