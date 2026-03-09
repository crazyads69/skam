import { Injectable, Logger } from '@nestjs/common'
import type { ScamCase } from '@skam/shared/src/types'

@Injectable()
export class TelegramNotifierService {
  private readonly logger = new Logger(TelegramNotifierService.name)
  private readonly botToken: string = process.env.TELEGRAM_BOT_TOKEN ?? ''
  private readonly chatId: string = process.env.TELEGRAM_CHAT_ID ?? ''
  private readonly apiBaseUrl: string = process.env.TELEGRAM_API_BASE_URL ?? 'https://api.telegram.org'
  private readonly enabled: boolean = (process.env.TELEGRAM_NOTIFY_ON_NEW_CASE ?? 'true') === 'true'

  public async notifyNewCase(input: ScamCase): Promise<void> {
    if (!this.enabled || !this.botToken || !this.chatId) return
    const message: string = this.buildNewCaseMessage(input)
    const url: string = `${this.apiBaseUrl}/bot${this.botToken}/sendMessage`
    const payload = {
      chat_id: this.chatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    }
    try {
      const response = await this.fetchWithTimeout(url, payload, 5000)
      if (!response?.ok) {
        this.logger.warn(`telegram_notify_failed status=${response?.status ?? 'no_response'}`)
      }
    } catch (error) {
      const reason: string = error instanceof Error ? error.message : 'unknown_error'
      this.logger.warn(`telegram_notify_error reason=${reason}`)
    }
  }

  private buildNewCaseMessage(input: ScamCase): string {
    const reportUrlBase: string = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ''
    const adminUrl: string = reportUrlBase ? `${reportUrlBase.replace(/\/$/, '')}/admin` : 'N/A'
    const amountLabel: string = input.amount != null ? String(input.amount) : 'N/A'
    const lines: string[] = [
      '🚨 <b>New scam case submitted</b>',
      '',
      `<b>Case ID:</b> <code>${this.escapeHtml(input.id)}</code>`,
      `<b>Bank:</b> ${this.escapeHtml(input.bankCode)} - ${this.escapeHtml(input.bankIdentifier)}`,
      `<b>Name:</b> ${this.escapeHtml(input.bankName)}`,
      `<b>Amount:</b> ${this.escapeHtml(amountLabel)}`,
      `<b>Status:</b> ${this.escapeHtml(input.status)}`,
      '',
      `<b>Description:</b> ${this.escapeHtml(input.originalDescription).slice(0, 1200)}`,
      '',
      `<b>Review:</b> ${this.escapeHtml(adminUrl)}`
    ]
    return lines.join('\n')
  }

  private escapeHtml(input: string): string {
    return input
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
  }

  private async fetchWithTimeout(url: string, payload: unknown, timeoutMs: number): Promise<Response | null> {
    const abortController = new AbortController()
    const timer = setTimeout(() => abortController.abort(), timeoutMs)
    try {
      return await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json'
        },
        body: JSON.stringify(payload),
        signal: abortController.signal
      })
    } catch {
      return null
    } finally {
      clearTimeout(timer)
    }
  }
}
