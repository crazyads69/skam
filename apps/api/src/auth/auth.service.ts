import { Injectable, UnauthorizedException } from '@nestjs/common'
import { SignJWT, jwtVerify } from 'jose'
import { randomBytes, randomUUID } from 'node:crypto'
import { CacheService } from '../cache/cache.service'

export interface AdminPrincipal {
  username: string
  provider: 'github'
}

@Injectable()
export class AuthService {
  private readonly loginCodeTtlSeconds: number = 120
  private readonly tokenTtlSeconds: number = 60 * 60 * 24

  public constructor(private readonly cache: CacheService) {}

  public async issueAdminToken(principal: AdminPrincipal): Promise<string> {
    this.assertAdmin(principal.username)
    const secret: Uint8Array = this.getSecret()
    const nowSeconds: number = Math.floor(Date.now() / 1000)
    const jti: string = randomUUID()
    return new SignJWT({
      sub: principal.username,
      username: principal.username,
      provider: principal.provider,
      jti
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt(nowSeconds)
      .setExpirationTime('24h')
      .setIssuer('skam-api')
      .setAudience('skam-admin')
      .setJti(jti)
      .sign(secret)
  }

  public async verifyAdminToken(token: string): Promise<AdminPrincipal> {
    const secret: Uint8Array = this.getSecret()
    try {
      const { payload } = await jwtVerify(token, secret, {
        issuer: 'skam-api',
        audience: 'skam-admin'
      })
      const jti: string = String(payload.jti ?? '')
      if (jti) {
        const isDenied = await this.cache.get<string>(`auth:deny:${jti}`)
        if (isDenied) throw new UnauthorizedException('Token đã bị thu hồi')
      }
      const username: string = String(payload.username ?? payload.sub ?? '').trim().toLowerCase()
      this.assertAdmin(username)
      return { username, provider: 'github' }
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error
      throw new UnauthorizedException('Token không hợp lệ')
    }
  }

  public async revokeToken(token: string): Promise<void> {
    const secret: Uint8Array = this.getSecret()
    try {
      const { payload } = await jwtVerify(token, secret, {
        issuer: 'skam-api',
        audience: 'skam-admin'
      })
      const jti: string = String(payload.jti ?? '')
      if (!jti) return
      const exp: number = payload.exp ?? 0
      const remainingSeconds: number = Math.max(0, exp - Math.floor(Date.now() / 1000))
      if (remainingSeconds > 0) {
        await this.cache.set(`auth:deny:${jti}`, 'revoked', remainingSeconds)
      }
    } catch {
      // Token already invalid, no need to revoke
    }
  }

  public async issueAdminLoginCode(principal: AdminPrincipal): Promise<string> {
    this.assertAdmin(principal.username)
    const code: string = randomBytes(24).toString('hex')
    await this.cache.set(`auth:login-code:${code}`, principal, this.loginCodeTtlSeconds)
    return code
  }

  public async exchangeAdminLoginCode(code: string): Promise<{ token: string; principal: AdminPrincipal }> {
    if (!/^[a-f0-9]{32,128}$/.test(code)) {
      throw new UnauthorizedException('Mã đăng nhập không hợp lệ')
    }
    const cachedPrincipal = await this.cache.get<AdminPrincipal>(`auth:login-code:${code}`)
    if (!cachedPrincipal) {
      throw new UnauthorizedException('Mã đăng nhập đã hết hạn hoặc không tồn tại')
    }
    await this.cache.del(`auth:login-code:${code}`)
    const token: string = await this.issueAdminToken(cachedPrincipal)
    return { token, principal: cachedPrincipal }
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
