import { IsString, MaxLength, MinLength } from "class-validator";

export class PublicViewUrlDto {
  @IsString()
  @MinLength(10)
  @MaxLength(40)
  public caseId!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(40)
  public evidenceId!: string;
}
