import { Injectable } from '@nestjs/common'

interface TurnstileResponse {
  success: boolean
  'error-codes'?: string[]
}

@Injectable()
export class TurnstileService {
  public async verify(token: string, remoteIp?: string): Promise<boolean> {
    const secret: string | undefined = process.env.TURNSTILE_SECRET_KEY
    if (!secret) return true
    const body: Record<string, string> = {
      secret,
      response: token
    }
    if (remoteIp) body.remoteip = remoteIp
    const response: Response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    })
    const payload: TurnstileResponse = await response.json()
    return payload.success === true
  }
}
