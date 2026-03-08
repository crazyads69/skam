import { IsString, MaxLength, MinLength } from 'class-validator'

export class RefineCaseDto {
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  public refinedDescription!: string
}
