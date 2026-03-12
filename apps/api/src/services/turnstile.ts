export class TurnstileService {
  isEnabled(): boolean {
    return Boolean(String(process.env.TURNSTILE_SECRET_KEY ?? "").trim());
  }

  async verify(token: string, remoteIp?: string): Promise<boolean> {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    const allowBypass =
      (process.env.TURNSTILE_ALLOW_BYPASS ?? "false") === "true";
    if (!secret) return allowBypass;

    const timeoutMs = Math.max(
      1000,
      Number(process.env.TURNSTILE_TIMEOUT_MS ?? "5000"),
    );
    const body: Record<string, string> = { secret, response: token };
    if (remoteIp) body.remoteip = remoteIp;

    const abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), timeoutMs);
    try {
      const response = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          signal: abortController.signal,
        },
      );
      if (!response.ok) return false;
      const payload = (await response.json()) as { success: boolean };
      return payload.success === true;
    } catch (error) {
      console.warn(
        `turnstile_verify_error reason=${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}

export const turnstile = new TurnstileService();
