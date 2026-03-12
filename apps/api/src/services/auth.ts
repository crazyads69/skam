import { SignJWT, jwtVerify } from "jose";
import { randomBytes, randomUUID } from "node:crypto";
import { unauthorized } from "../common/error";
import type { CacheService } from "./cache";

export interface AdminPrincipal {
  username: string;
  provider: "github";
}

export class AuthService {
  private readonly loginCodeTtlSeconds = 2 * 60;
  private readonly tokenTtlSeconds = 24 * 60 * 60;

  constructor(private readonly cache: CacheService) {}

  async issueAdminToken(principal: AdminPrincipal): Promise<string> {
    this.assertAdmin(principal.username);
    const secret = this.getSecret();
    const nowSeconds = Math.floor(Date.now() / 1000);
    const jti = randomUUID();
    return new SignJWT({
      sub: principal.username,
      username: principal.username,
      provider: principal.provider,
      jti,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt(nowSeconds)
      .setExpirationTime("24h")
      .setIssuer("skam-api")
      .setAudience("skam-admin")
      .setJti(jti)
      .sign(secret);
  }

  async verifyAdminToken(token: string): Promise<AdminPrincipal> {
    const secret = this.getSecret();
    try {
      const { payload } = await jwtVerify(token, secret, {
        issuer: "skam-api",
        audience: "skam-admin",
      });
      const jti = String(payload.jti ?? "");
      if (jti) {
        const isDenied = await this.cache.get<string>(`auth:deny:${jti}`);
        if (isDenied) throw unauthorized("Token đã bị thu hồi");
      }
      const username = String(payload.username ?? payload.sub ?? "")
        .trim()
        .toLowerCase();
      this.assertAdmin(username);
      return { username, provider: "github" };
    } catch (error) {
      if (error instanceof Error && "status" in error) throw error;
      throw unauthorized("Token không hợp lệ");
    }
  }

  async revokeToken(token: string): Promise<void> {
    const secret = this.getSecret();
    try {
      const { payload } = await jwtVerify(token, secret, {
        issuer: "skam-api",
        audience: "skam-admin",
      });
      const jti = String(payload.jti ?? "");
      if (!jti) return;
      const exp = payload.exp ?? 0;
      const remainingSeconds = Math.max(0, exp - Math.floor(Date.now() / 1000));
      if (remainingSeconds > 0) {
        await this.cache.set(`auth:deny:${jti}`, "revoked", remainingSeconds);
      }
    } catch {
      // Token already invalid
    }
  }

  async issueAdminLoginCode(principal: AdminPrincipal): Promise<string> {
    this.assertAdmin(principal.username);
    const code = randomBytes(24).toString("hex");
    await this.cache.set(
      `auth:login-code:${code}`,
      principal,
      this.loginCodeTtlSeconds,
    );
    return code;
  }

  async exchangeAdminLoginCode(
    code: string,
  ): Promise<{ token: string; principal: AdminPrincipal }> {
    if (!/^[a-f0-9]{48}$/.test(code)) {
      throw unauthorized("Mã đăng nhập không hợp lệ");
    }
    const cachedPrincipal = await this.cache.get<AdminPrincipal>(
      `auth:login-code:${code}`,
    );
    if (!cachedPrincipal) {
      throw unauthorized("Mã đăng nhập đã hết hạn hoặc không tồn tại");
    }
    await this.cache.del(`auth:login-code:${code}`);
    const token = await this.issueAdminToken(cachedPrincipal);
    return { token, principal: cachedPrincipal };
  }

  private getSecret(): Uint8Array {
    const secretRaw = process.env.NEXTAUTH_SECRET;
    if (!secretRaw) throw unauthorized("Thiếu NEXTAUTH_SECRET");
    return new TextEncoder().encode(secretRaw);
  }

  private assertAdmin(username: string): void {
    const whitelist = this.getAdminWhitelist();
    if (!username || !whitelist.includes(username.toLowerCase())) {
      throw unauthorized("Tài khoản không có quyền quản trị");
    }
  }

  private getAdminWhitelist(): string[] {
    return String(process.env.ADMIN_WHITELIST ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }
}
