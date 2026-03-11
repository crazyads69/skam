import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { SocialPlatform } from "@skam/shared/src/types";

export class CreateSocialLinkDto {
  @IsEnum(SocialPlatform)
  public platform!: SocialPlatform;

  @IsUrl()
  @MaxLength(500)
  public url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  public username?: string;
}

export class CreateEvidenceFileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  public fileType!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(300)
  public fileKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  public fileName?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100 * 1024 * 1024)
  public fileSize?: number;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  public fileHash?: string;
}

export class CreateCaseDto {
  @IsString()
  @MinLength(8)
  @MaxLength(40)
  @Matches(/^\d{8,20}$/, { message: "Số tài khoản phải từ 8-20 chữ số" })
  public bankIdentifier!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  public bankName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(10)
  @Matches(/^[A-Za-z0-9]+$/, { message: "Mã ngân hàng không hợp lệ" })
  public bankCode!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100_000_000_000)
  public amount?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  public scammerName?: string;

  @IsString()
  @MinLength(50)
  @MaxLength(5000)
  public originalDescription!: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  public turnstileToken?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  public submitterFingerprint?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSocialLinkDto)
  public socialLinks?: CreateSocialLinkDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEvidenceFileDto)
  public evidenceFiles?: CreateEvidenceFileDto[];
}
