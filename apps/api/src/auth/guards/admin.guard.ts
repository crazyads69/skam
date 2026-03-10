import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { CacheService } from "../../cache/cache.service";
import { resolveRequestIdentifier } from "../../common/request-identifier";
import { AuthService, type AdminPrincipal } from "../auth.service";

interface AuthenticatedRequest {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
  user?: AdminPrincipal;
}

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly authRateLimit: number;
  private readonly authRateLimitWindowSeconds: number;

  public constructor(
    private readonly authService: AuthService,
    private readonly cache: CacheService,
  ) {
    this.authRateLimit = this.readPositiveInt("ADMIN_AUTH_RATE_LIMIT", 120);
    this.authRateLimitWindowSeconds = this.readPositiveInt(
      "ADMIN_AUTH_RATE_LIMIT_WINDOW_SECONDS",
      60,
    );
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: AuthenticatedRequest = context.switchToHttp().getRequest();
    const requester: string = resolveRequestIdentifier(request);
    const rateLimitKey: string = `ratelimit:admin-auth:${requester}`;
    const allowed: boolean = await this.cache.fixedWindowLimit(
      rateLimitKey,
      this.authRateLimit,
      this.authRateLimitWindowSeconds,
    );
    if (!allowed) {
      throw new HttpException(
        "Bạn đã gửi quá số lần xác thực, vui lòng thử lại sau",
        429,
      );
    }
    const authHeader: string | undefined = this.getAuthHeader(
      request.headers.authorization,
    );
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Thiếu Authorization Bearer token");
    }
    const token: string = authHeader.slice("Bearer ".length).trim();
    request.user = await this.authService.verifyAdminToken(token);
    return true;
  }

  private getAuthHeader(
    raw: string | string[] | undefined,
  ): string | undefined {
    if (!raw) return undefined;
    return Array.isArray(raw) ? raw[0] : raw;
  }

  private readPositiveInt(key: string, fallback: number): number {
    const raw: string = String(process.env[key] ?? "").trim();
    if (!raw) return fallback;
    const parsed: number = Number(raw);
    if (!Number.isFinite(parsed)) return fallback;
    const integer: number = Math.floor(parsed);
    return integer > 0 ? integer : fallback;
  }
}
