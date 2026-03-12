import { Elysia } from "elysia";
import { tooManyRequests, unauthorized } from "../common/error";
import { resolveRequestIdentifier } from "../common/request-identifier";
import { cache } from "../services/cache";
import { AuthService, type AdminPrincipal } from "../services/auth";

const authService = new AuthService(cache);

export { authService };

export const adminAuth = new Elysia({ name: "admin-auth" }).resolve(
  async ({ headers, server, request }) => {
    const ip = server?.requestIP(request)?.address;
    const identifier = resolveRequestIdentifier(
      headers as Record<string, string | undefined>,
      ip,
    );

    const allowed = await cache.fixedWindowLimit(
      `ratelimit:admin-auth:${identifier}`,
      120,
      60,
    );
    if (!allowed) {
      throw tooManyRequests(
        "Bạn đã gửi quá số lần xác thực, vui lòng thử lại sau",
      );
    }

    const authHeader = headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw unauthorized("Thiếu Authorization Bearer token");
    }

    const token = authHeader.slice(7).trim();
    const admin = await authService.verifyAdminToken(token);

    return { admin, clientId: identifier };
  },
);
