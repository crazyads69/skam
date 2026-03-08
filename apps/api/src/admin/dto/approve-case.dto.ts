import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class ApproveCaseDto {
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  public refinedDescription?: string
}
