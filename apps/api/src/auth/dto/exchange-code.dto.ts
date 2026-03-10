import { IsString, MaxLength, MinLength } from 'class-validator'

export class ExchangeCodeDto {
  @IsString()
  @MinLength(32)
  @MaxLength(128)
  public code!: string
}
