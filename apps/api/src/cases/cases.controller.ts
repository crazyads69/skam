import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import type { ApiResponse } from "@skam/shared/src/types";
import { CreateCaseDto } from "./dto/create-case.dto";
import { SearchCaseDto } from "./dto/search-case.dto";
import { CasesService } from "./cases.service";

interface RequestLike {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}

@Controller("cases")
export class CasesController {
  public constructor(private readonly casesService: CasesService) {}

  @Post()
  public async createCase(
    @Body() payload: CreateCaseDto,
    @Req() request: RequestLike,
  ): Promise<ApiResponse<Awaited<ReturnType<CasesService["createCase"]>>>> {
    const forwardedFor: string | string[] | undefined =
      request.headers["x-forwarded-for"];
    const candidateIp: string | undefined =
      typeof forwardedFor === "string"
        ? forwardedFor.split(",")[0]?.trim()
        : request.ip;
    const data = await this.casesService.createCase(payload, candidateIp);
    return { success: true, data };
  }

  @Get("search")
  public async searchCases(
    @Query() query: SearchCaseDto,
  ): Promise<Awaited<ReturnType<CasesService["searchCases"]>>> {
    return this.casesService.searchCases(query);
  }

  @Get(":id")
  public async getCaseById(
    @Param("id") id: string,
  ): Promise<ApiResponse<Awaited<ReturnType<CasesService["getCaseById"]>>>> {
    const data = await this.casesService.getCaseById(id);
    return { success: true, data };
  }
}
