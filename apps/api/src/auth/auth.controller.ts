import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { ApiResponse } from "@skam/shared/src/types";
import { CacheService } from "../cache/cache.service";
import {
  resolveRequestIdentifier,
  type RequestLike,
} from "../common/request-identifier";
import { AuthService, type AdminPrincipal } from "./auth.service";
import { ExchangeCodeDto } from "./dto/exchange-code.dto";
import { AdminGuard } from "./guards/admin.guard";
import { GitHubAuthGuard } from "./guards/github-auth.guard";

interface OAuthRequestLike {
  user?: {
    username: string;
  };
}

interface RedirectResponseLike {
  redirect(url: string): void;
}

interface AdminRequestLike {
  user?: AdminPrincipal;
}

@Controller("auth")
export class AuthController {
  public constructor(
    private readonly authService: AuthService,
    private readonly cache: CacheService,
  ) {}

  @Get("github")
  @UseGuards(GitHubAuthGuard)
  public githubLogin(): void {}

  @Get("github/callback")
  @UseGuards(GitHubAuthGuard)
  public async githubCallback(
    @Req() request: OAuthRequestLike,
    @Res() response: RedirectResponseLike,
  ): Promise<void> {
    const username: string = request.user?.username ?? "";
    const code: string = await this.authService.issueAdminLoginCode({
      username,
      provider: "github",
    });
    const webBase: string = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    response.redirect(
      `${webBase}/admin/login?code=${encodeURIComponent(code)}`,
    );
  }

  @Post("code/exchange")
  public async exchangeCode(
    @Body() payload: ExchangeCodeDto,
    @Req() request: RequestLike,
  ): Promise<ApiResponse<{ token: string; principal: AdminPrincipal }>> {
    const identifier: string = resolveRequestIdentifier(request);
    const allowed: boolean = await this.cache.fixedWindowLimit(
      `ratelimit:code-exchange:${identifier}`,
      10,
      60,
    );
    if (!allowed) {
      throw new HttpException(
        "Bạn đã gửi quá số lần đổi mã, vui lòng thử lại sau",
        429,
      );
    }
    const result = await this.authService.exchangeAdminLoginCode(payload.code);
    return {
      success: true,
      data: result,
    };
  }

  @Get("me")
  @UseGuards(AdminGuard)
  public me(@Req() request: AdminRequestLike): ApiResponse<AdminPrincipal> {
    return {
      success: true,
      data: request.user as AdminPrincipal,
    };
  }

  @Post("logout")
  public async logout(
    @Req() request: RequestLike,
  ): Promise<ApiResponse<{ revoked: boolean }>> {
    const identifier: string = resolveRequestIdentifier(request);
    const allowed: boolean = await this.cache.fixedWindowLimit(
      `ratelimit:logout:${identifier}`,
      20,
      60,
    );
    if (!allowed) {
      throw new HttpException("Vượt giới hạn đăng xuất", 429);
    }
    const authHeader = request.headers.authorization;
    const raw: string = Array.isArray(authHeader)
      ? (authHeader[0] ?? "")
      : (authHeader ?? "");
    if (raw.startsWith("Bearer ")) {
      await this.authService.revokeToken(raw.slice("Bearer ".length).trim());
    }
    return {
      success: true,
      data: { revoked: true },
    };
  }
}
