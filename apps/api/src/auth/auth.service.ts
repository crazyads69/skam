import { Injectable, UnauthorizedException } from '@nestjs/common'
import { SignJWT, jwtVerify } from 'jose'
import { ADMIN_WHITELIST } from './constants/admin-whitelist'

export interface AdminPrincipal {
  username: string
  provider: 'github'
}

@Injectable()
export class AuthService {
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

  private getSecret(): Uint8Array {
    const secretRaw: string | undefined = process.env.NEXTAUTH_SECRET
    if (!secretRaw) {
      throw new UnauthorizedException('Thiếu NEXTAUTH_SECRET')
    }
    return new TextEncoder().encode(secretRaw)
  }

  private assertAdmin(username: string): void {
    if (!username || !ADMIN_WHITELIST.includes(username.toLowerCase())) {
      throw new UnauthorizedException('Tài khoản không có quyền quản trị')
    }
  }
}
