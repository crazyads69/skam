import { Injectable, Logger } from '@nestjs/common'

interface TurnstileResponse {
  success: boolean
  'error-codes'?: string[]
}

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name)

  public async verify(token: string, remoteIp?: string): Promise<boolean> {
    const secret: string | undefined = process.env.TURNSTILE_SECRET_KEY
    const allowBypass: boolean = (process.env.TURNSTILE_ALLOW_BYPASS ?? 'true') === 'true'
    if (!secret) return allowBypass
    const timeoutMs: number = Math.max(1000, Number(process.env.TURNSTILE_TIMEOUT_MS ?? '5000'))
    const body: Record<string, string> = {
      secret,
      response: token
    }
    if (remoteIp) body.remoteip = remoteIp
    const abortController = new AbortController()
    const timer = setTimeout(() => abortController.abort(), timeoutMs)
    try {
      const response: Response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortController.signal
      })
      if (!response.ok) return false
      const payload: TurnstileResponse = await response.json()
      return payload.success === true
    } catch (error) {
      const reason: string = error instanceof Error ? error.message : String(error)
      this.logger.warn(`turnstile_verify_error reason=${reason}`)
      return false
    } finally {
      clearTimeout(timer)
    }
  }
}
