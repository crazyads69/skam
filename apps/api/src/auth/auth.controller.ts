import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common'
import type { ApiResponse } from '@skam/shared/src/types'
import { AuthService, type AdminPrincipal } from './auth.service'
import { AdminGuard } from './guards/admin.guard'
import { GitHubAuthGuard } from './guards/github-auth.guard'

interface OAuthRequestLike {
  user?: {
    username: string
  }
}

interface RedirectResponseLike {
  redirect(url: string): void
}

interface AdminRequestLike {
  user?: AdminPrincipal
}

@Controller('auth')
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Get('github')
  @UseGuards(GitHubAuthGuard)
  public githubLogin(): void {}

  @Get('github/callback')
  @UseGuards(GitHubAuthGuard)
  public async githubCallback(
    @Req() request: OAuthRequestLike,
    @Res() response: RedirectResponseLike
  ): Promise<void> {
    const username: string = request.user?.username ?? ''
    const token: string = await this.authService.issueAdminToken({
      username,
      provider: 'github'
    })
    const webBase: string = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    response.redirect(`${webBase}/admin#token=${encodeURIComponent(token)}`)
  }

  @Get('me')
  @UseGuards(AdminGuard)
  public me(@Req() request: AdminRequestLike): ApiResponse<AdminPrincipal> {
    return {
      success: true,
      data: request.user as AdminPrincipal
    }
  }

  @Post('logout')
  public logout(): ApiResponse<{ revoked: boolean }> {
    return {
      success: true,
      data: { revoked: true }
    }
  }
}
