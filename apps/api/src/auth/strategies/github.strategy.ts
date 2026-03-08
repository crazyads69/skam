import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-github2'

interface GitHubProfile {
  username?: string
}

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  public constructor() {
    const clientID: string = process.env.GITHUB_CLIENT_ID ?? 'dummy-client-id'
    const clientSecret: string = process.env.GITHUB_CLIENT_SECRET ?? 'dummy-client-secret'
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
