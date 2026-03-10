import { Injectable, UnauthorizedException } from '@nestjs/common'
import { SignJWT, jwtVerify } from 'jose'
import { randomBytes } from 'node:crypto'
import { CacheService } from '../cache/cache.service'

export interface AdminPrincipal {
  username: string
  provider: 'github'
}

@Injectable()
export class AuthService {
  private readonly loginCodeTtlSeconds: number = 120
  private readonly inMemoryLoginCodes: Map<string, { principal: AdminPrincipal; expiresAt: number }> = new Map()

  public constructor(private readonly cache: CacheService) {}

  public async issueAdminToken(principal: AdminPrincipal): Promise<string> {
    this.assertAdmin(principal.username)
    const secret: Uint8Array = this.getSecret()
    const nowSeconds: number = Math.floor(Date.now() / 1000)
    return new SignJWT({
      sub: principal.username,
      username: principal.username,
      provider: principal.provider
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt(nowSeconds)
      .setExpirationTime('24h')
      .setIssuer('skam-api')
      .setAudience('skam-admin')
      .sign(secret)
  }

  public async verifyAdminToken(token: string): Promise<AdminPrincipal> {
    const secret: Uint8Array = this.getSecret()
    try {
      const { payload } = await jwtVerify(token, secret, {
        issuer: 'skam-api',
        audience: 'skam-admin'
      })
      const username: string = String(payload.username ?? payload.sub ?? '').trim().toLowerCase()
      this.assertAdmin(username)
      return { username, provider: 'github' }
    } catch {
      throw new UnauthorizedException('Token không hợp lệ')
    }
  }

  public async issueAdminLoginCode(principal: AdminPrincipal): Promise<string> {
    this.assertAdmin(principal.username)
    const code: string = randomBytes(24).toString('hex')
    const expiresAt: number = Date.now() + this.loginCodeTtlSeconds * 1000
    this.inMemoryLoginCodes.set(code, { principal, expiresAt })
    await this.cache.set(`auth:login-code:${code}`, principal, this.loginCodeTtlSeconds)
    return code
  }

  public async exchangeAdminLoginCode(code: string): Promise<{ token: string; principal: AdminPrincipal }> {
    if (!/^[a-f0-9]{32,128}$/.test(code)) {
      throw new UnauthorizedException('Mã đăng nhập không hợp lệ')
    }
    const cachedPrincipal = await this.cache.get<AdminPrincipal>(`auth:login-code:${code}`)
    if (cachedPrincipal) {
      await this.cache.del(`auth:login-code:${code}`)
      const token: string = await this.issueAdminToken(cachedPrincipal)
      return { token, principal: cachedPrincipal }
    }
    const local = this.inMemoryLoginCodes.get(code)
    this.inMemoryLoginCodes.delete(code)
    if (!local || local.expiresAt < Date.now()) {
      throw new UnauthorizedException('Mã đăng nhập đã hết hạn hoặc không tồn tại')
    }
    const token: string = await this.issueAdminToken(local.principal)
    return { token, principal: local.principal }
  }

  private getSecret(): Uint8Array {
    const secretRaw: string | undefined = process.env.NEXTAUTH_SECRET
    if (!secretRaw) {
      throw new UnauthorizedException('Thiếu NEXTAUTH_SECRET')
    }
    return new TextEncoder().encode(secretRaw)
  }

  private assertAdmin(username: string): void {
    const whitelist: string[] = this.getAdminWhitelist()
    if (!username || !whitelist.includes(username.toLowerCase())) {
      throw new UnauthorizedException('Tài khoản không có quyền quản trị')
    }
  }

  private getAdminWhitelist(): string[] {
    return String(process.env.ADMIN_WHITELIST ?? '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  }
}
