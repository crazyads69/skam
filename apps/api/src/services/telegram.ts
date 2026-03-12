import type { ScamCase } from "@skam/shared/src/types";
import { escapeHtml } from "@skam/shared/src/utils";

export class TelegramService {
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
  private readonly chatId = process.env.TELEGRAM_CHAT_ID ?? "";
  private readonly apiBaseUrl =
    process.env.TELEGRAM_API_BASE_URL ?? "https://api.telegram.org";
  private readonly enabled =
    (process.env.TELEGRAM_NOTIFY_ON_NEW_CASE ?? "true") === "true";

  async notifyNewCase(input: ScamCase): Promise<void> {
    if (!this.enabled || !this.botToken || !this.chatId) return;

    const reportUrlBase =
      process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
    const adminUrl = reportUrlBase
      ? `${reportUrlBase.replace(/\/$/, "")}/admin`
      : "N/A";
    const amountLabel = input.amount != null ? String(input.amount) : "N/A";

    const message = [
      "🚨 <b>Có báo cáo lừa đảo mới</b>",
      "",
      `<b>Mã vụ việc:</b> <code>${escapeHtml(input.id)}</code>`,
      `<b>Ngân hàng:</b> ${escapeHtml(input.bankCode)} - ${escapeHtml(input.bankIdentifier)}`,
      `<b>Tên chủ tài khoản:</b> ${escapeHtml(input.bankName)}`,
      `<b>Số tiền:</b> ${escapeHtml(amountLabel)}`,
      `<b>Trạng thái:</b> ${escapeHtml(input.status)}`,
      "",
      `<b>Mô tả:</b> ${escapeHtml(input.originalDescription).slice(0, 1_200)}`,
      "",
      `<b>Trang kiểm duyệt:</b> ${escapeHtml(adminUrl)}`,
    ].join("\n");

    const url = `${this.apiBaseUrl}/bot${this.botToken}/sendMessage`;
    const payload = {
      chat_id: this.chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    };

    const abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), 5000);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });
      if (!response?.ok) {
        console.warn(
          `telegram_notify_failed status=${response?.status ?? "no_response"}`,
        );
      }
    } catch (error) {
      console.warn(
        `telegram_notify_error reason=${error instanceof Error ? error.message : "unknown_error"}`,
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

export const telegram = new TelegramService();
