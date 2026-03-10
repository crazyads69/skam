import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class ViewUrlDto {
  @IsString()
  @MinLength(10)
  @MaxLength(255)
  @Matches(/^evidence\/[a-zA-Z0-9._/-]+$/)
  public fileKey!: string;
}
