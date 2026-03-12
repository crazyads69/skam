import { Elysia } from "elysia";
import { ExchangeCodeBody, GitHubCallbackQuery } from "./model";
import { authService } from "../../plugins/admin-auth";
import { cache } from "../../services/cache";
import { resolveRequestIdentifier } from "../../common/request-identifier";
import { tooManyRequests, badRequest } from "../../common/error";

export const authModule = new Elysia({ prefix: "/auth" })
  .get("/github", ({ redirect }) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const callbackUrl =
      process.env.GITHUB_CALLBACK_URL ??
      "http://localhost:4000/api/v1/auth/github/callback";
    const scope = "read:user user:email";
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${encodeURIComponent(scope)}`;
    return redirect(url);
  })
  .get(
    "/github/callback",
    async ({ query, redirect }) => {
      const tokenRes = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: query.code,
          }),
        },
      );
      const tokenData = (await tokenRes.json()) as { access_token?: string };
      if (!tokenData.access_token) {
        throw badRequest("Failed to exchange code for access token");
      }

      const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const user = (await userRes.json()) as { login: string };
      const username = user.login.toLowerCase().trim();

      const code = await authService.issueAdminLoginCode({
        username,
        provider: "github",
      });

      const webBase = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      return redirect(`${webBase}/admin/login?code=${code}`);
    },
    { query: GitHubCallbackQuery },
  )
  .post(
    "/code/exchange",
    async ({ body, headers, server, request }) => {
      const ip = server?.requestIP(request)?.address;
      const identifier = resolveRequestIdentifier(
        headers as Record<string, string | undefined>,
        ip,
      );
      const allowed = await cache.fixedWindowLimit(
        `ratelimit:auth:exchange:${identifier}`,
        10,
        60,
      );
      if (!allowed)
        throw tooManyRequests("Quá nhiều yêu cầu, vui lòng thử lại sau");

      const { token, principal } = await authService.exchangeAdminLoginCode(
        body.code,
      );
      return { success: true, data: { token, principal } };
    },
    { body: ExchangeCodeBody },
  )
  .post("/logout", async ({ headers, server, request }) => {
    const ip = server?.requestIP(request)?.address;
    const identifier = resolveRequestIdentifier(
      headers as Record<string, string | undefined>,
      ip,
    );
    const allowed = await cache.fixedWindowLimit(
      `ratelimit:auth:logout:${identifier}`,
      20,
      60,
    );
    if (!allowed)
      throw tooManyRequests("Quá nhiều yêu cầu, vui lòng thử lại sau");

    const authHeader = headers.authorization;
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!token) throw badRequest("Thiếu Authorization token");

    await authService.revokeToken(token);
    return { success: true, data: { revoked: true } };
  })
  .get("/me", async ({ headers }) => {
    const authHeader = headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      throw badRequest("Thiếu Authorization token");
    const token = authHeader.slice(7).trim();
    const admin = await authService.verifyAdminToken(token);
    return { success: true, data: admin };
  });
