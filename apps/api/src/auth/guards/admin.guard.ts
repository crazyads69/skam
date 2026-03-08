import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthService, type AdminPrincipal } from '../auth.service'

interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>
  user?: AdminPrincipal
}

@Injectable()
export class AdminGuard implements CanActivate {
  public constructor(private readonly authService: AuthService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: AuthenticatedRequest = context.switchToHttp().getRequest()
    const authHeader: string | undefined = this.getAuthHeader(request.headers.authorization)
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Thiếu Authorization Bearer token')
    }
    const token: string = authHeader.slice('Bearer '.length).trim()
    request.user = await this.authService.verifyAdminToken(token)
    return true
  }

  private getAuthHeader(raw: string | string[] | undefined): string | undefined {
    if (!raw) return undefined
    return Array.isArray(raw) ? raw[0] : raw
  }
}
