import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { ApiResponse } from "@skam/shared/src/types";
import { CaseStatus } from "@skam/shared/src/types";
import { BanksService } from "../banks/banks.service";
import { type AdminPrincipal } from "../auth/auth.service";
import { AdminGuard } from "../auth/guards/admin.guard";
import { PaginateCaseDto } from "../cases/dto/paginate-case.dto";
import { AdminService } from "./admin.service";
import { ApproveCaseDto } from "./dto/approve-case.dto";
import { RefineCaseDto } from "./dto/refine-case.dto";
import { RejectCaseDto } from "./dto/reject-case.dto";

interface AdminRequestLike {
  user?: AdminPrincipal;
}

@Controller("admin")
@UseGuards(AdminGuard)
export class AdminController {
  public constructor(
    private readonly adminService: AdminService,
    private readonly banksService: BanksService,
  ) {}

  @Get("cases")
  public async listCases(
    @Query("status") status?: CaseStatus,
    @Query() pagination?: PaginateCaseDto,
  ): Promise<Awaited<ReturnType<AdminService["listCases"]>>> {
    const allowedStatuses: CaseStatus[] = [
      CaseStatus.PENDING,
      CaseStatus.APPROVED,
      CaseStatus.REJECTED,
    ];
    if (status && !allowedStatuses.includes(status)) {
      throw new BadRequestException("Trạng thái không hợp lệ");
    }
    const safePage: number = pagination?.page ?? 1;
    const safePageSize: number = Math.min(100, pagination?.pageSize ?? 20);
    return this.adminService.listCases(status, safePage, safePageSize);
  }

  @Get("cases/pending")
  public async pendingCases(): Promise<
    Awaited<ReturnType<AdminService["listCases"]>>
  > {
    return this.adminService.listCases(CaseStatus.PENDING, 1, 50);
  }

  @Get("cases/:id")
  public async getCaseById(
    @Param("id") id: string,
  ): Promise<ApiResponse<Awaited<ReturnType<AdminService["getCaseById"]>>>> {
    const data = await this.adminService.getCaseById(id);
    return { success: true, data };
  }

  @Patch("cases/:id/approve")
  public async approveCase(
    @Param("id") id: string,
    @Body() payload: ApproveCaseDto,
    @Req() request: AdminRequestLike,
  ): Promise<ApiResponse<Awaited<ReturnType<AdminService["approveCase"]>>>> {
    const actor: string = request.user?.username ?? "unknown";
    const data = await this.adminService.approveCase(id, actor, payload);
    return { success: true, data };
  }

  @Patch("cases/:id/reject")
  public async rejectCase(
    @Param("id") id: string,
    @Body() payload: RejectCaseDto,
    @Req() request: AdminRequestLike,
  ): Promise<ApiResponse<Awaited<ReturnType<AdminService["rejectCase"]>>>> {
    const actor: string = request.user?.username ?? "unknown";
    const data = await this.adminService.rejectCase(id, actor, payload);
    return { success: true, data };
  }

  @Patch("cases/:id/refine")
  public async refineCase(
    @Param("id") id: string,
    @Body() payload: RefineCaseDto,
  ): Promise<ApiResponse<Awaited<ReturnType<AdminService["refineCase"]>>>> {
    const data = await this.adminService.refineCase(id, payload);
    return { success: true, data };
  }

  @Delete("cases/:id")
  public async deleteCase(
    @Param("id") id: string,
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    await this.adminService.deleteCase(id);
    return { success: true, data: { deleted: true } };
  }

  @Post("banks/refresh")
  public async refreshBanks(): Promise<ApiResponse<{ refreshed: boolean }>> {
    await this.banksService.refreshBanks();
    return {
      success: true,
      data: { refreshed: true },
    };
  }

  @Get("analytics")
  public async analytics(): Promise<
    ApiResponse<Awaited<ReturnType<AdminService["getAdminAnalytics"]>>>
  > {
    const data = await this.adminService.getAdminAnalytics();
    return { success: true, data };
  }
}
