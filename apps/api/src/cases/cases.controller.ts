import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { ApiResponse } from "@skam/shared/src/types";
import { CacheService } from "../cache/cache.service";
import { assertAllowedWriteOrigin } from "../common/request-origin";
import {
  resolveRequestIdentifier,
  type RequestLike,
} from "../common/request-identifier";
import { CreateCaseDto } from "./dto/create-case.dto";
import { PaginateCaseDto } from "./dto/paginate-case.dto";
import { SearchCaseDto } from "./dto/search-case.dto";
import { CasesService } from "./cases.service";

@Controller("cases")
export class CasesController {
  public constructor(
    private readonly casesService: CasesService,
    private readonly cacheService: CacheService,
  ) {}

  @Post()
  public async createCase(
    @Body() payload: CreateCaseDto,
    @Req() request: RequestLike,
  ): Promise<ApiResponse<Awaited<ReturnType<CasesService["createCase"]>>>> {
    assertAllowedWriteOrigin(request.headers);
    const candidateIp: string = resolveRequestIdentifier(request);
    const data = await this.casesService.createCase(payload, candidateIp);
    return { success: true, data };
  }

  @Get("search")
  public async searchCases(
    @Query() query: SearchCaseDto,
    @Req() request: RequestLike,
  ): Promise<Awaited<ReturnType<CasesService["searchCases"]>>> {
    const identifier: string = resolveRequestIdentifier(request);
    const allowed: boolean = await this.cacheService.fixedWindowLimit(
      `ratelimit:cases-search:${identifier}`,
      30,
      60,
    );
    if (!allowed) {
      throw new HttpException("Vượt giới hạn tra cứu", 429);
    }
    return this.casesService.searchCases(query);
  }

  @Get("recent")
  public async listRecent(
    @Query() query: PaginateCaseDto,
    @Req() request: RequestLike,
  ): Promise<Awaited<ReturnType<CasesService["listRecent"]>>> {
    const identifier: string = resolveRequestIdentifier(request);
    const allowed: boolean = await this.cacheService.fixedWindowLimit(
      `ratelimit:cases-recent:${identifier}`,
      60,
      60,
    );
    if (!allowed) {
      throw new HttpException("Vượt giới hạn truy cập danh sách", 429);
    }
    return this.casesService.listRecent(query);
  }

  @Get(":id")
  public async getCaseById(
    @Param("id") id: string,
    @Req() request: RequestLike,
  ): Promise<ApiResponse<Awaited<ReturnType<CasesService["getCaseById"]>>>> {
    const identifier: string = resolveRequestIdentifier(request);
    const allowed: boolean = await this.cacheService.fixedWindowLimit(
      `ratelimit:case-detail:${identifier}`,
      60,
      60,
    );
    if (!allowed) {
      throw new HttpException("Vượt giới hạn truy cập vụ việc", 429);
    }
    const data = await this.casesService.getCaseById(id, identifier);
    return { success: true, data };
  }
}
