import { Type } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { IsInt, Max, Min } from "class-validator";

export class SearchCaseDto {
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  public q!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  public bankCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  public pageSize: number = 10;
}
