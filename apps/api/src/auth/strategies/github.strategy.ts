import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-github2'

interface GitHubProfile {
  username?: string
}

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  public constructor() {
    const clientID: string = String(process.env.GITHUB_CLIENT_ID ?? '').trim()
    const clientSecret: string = String(process.env.GITHUB_CLIENT_SECRET ?? '').trim()
    if (!clientID || !clientSecret) {
      throw new Error('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET')
    }
    super({
      clientID,
      clientSecret,
      callbackURL: process.env.GITHUB_CALLBACK_URL ?? 'http://localhost:4000/api/v1/auth/github/callback',
      scope: ['read:user', 'user:email']
    })
  }

  public async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GitHubProfile
  ): Promise<{ username: string }> {
    return {
      username: String(profile.username ?? '').trim().toLowerCase()
    }
  }
}
