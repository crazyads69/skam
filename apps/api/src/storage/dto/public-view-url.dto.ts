import { IsUUID } from "class-validator";

export class PublicViewUrlDto {
  @IsUUID()
  public caseId!: string;

  @IsUUID()
  public evidenceId!: string;
}
