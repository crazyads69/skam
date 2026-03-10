import { Transform } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

export class PaginateCaseDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  public page: number = 1;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(50)
  public pageSize: number = 10;
}
