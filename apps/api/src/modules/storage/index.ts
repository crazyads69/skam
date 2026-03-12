import { Elysia } from "elysia";
import { storageService } from "./service";
import { UploadPresignBody, ViewUrlBody, PublicViewUrlBody } from "./model";
import { adminAuth } from "../../plugins/admin-auth";
import { cache } from "../../services/cache";
import { resolveRequestIdentifier } from "../../common/request-identifier";
import { assertAllowedWriteOrigin } from "../../common/request-origin";
import { turnstile } from "../../services/turnstile";
import { tooManyRequests, badRequest } from "../../common/error";

export const storageModule = new Elysia({ prefix: "/upload" })
  .post(
    "/presign",
    async ({ body, headers, server, request }) => {
      assertAllowedWriteOrigin(headers as Record<string, string | undefined>);

      const ip = server?.requestIP(request)?.address;
      const identifier = resolveRequestIdentifier(
        headers as Record<string, string | undefined>,
        ip,
      );

      const allowed = await cache.fixedWindowLimit(
        `ratelimit:upload:${identifier}`,
        10,
        60,
      );
      if (!allowed) throw tooManyRequests("Vượt giới hạn tải lên");

      const dailyAllowed = await cache.fixedWindowLimit(
        `ratelimit:upload-daily:${identifier}`,
        50,
        60 * 60 * 24,
      );
      if (!dailyAllowed)
        throw tooManyRequests("Vượt giới hạn tải lên hàng ngày");

      if (turnstile.isEnabled()) {
        const turnstileToken = String(
          Array.isArray(headers["x-turnstile-token"])
            ? headers["x-turnstile-token"][0]
            : (headers["x-turnstile-token"] ?? ""),
        ).trim();
        if (!turnstileToken) throw badRequest("Thiếu Turnstile token");
        const isValid = await turnstile.verify(turnstileToken, ip);
        if (!isValid) throw badRequest("Turnstile token không hợp lệ");
      }

      const data = await storageService.presignUpload(body);
      return { success: true, data };
    },
    { body: UploadPresignBody },
  )
  .group("/view-url", (app) =>
    app.use(adminAuth).post(
      "",
      async ({ body, headers, server, request }) => {
        const ip = server?.requestIP(request)?.address;
        const identifier = resolveRequestIdentifier(
          headers as Record<string, string | undefined>,
          ip,
        );
        const allowed = await cache.fixedWindowLimit(
          `ratelimit:admin-upload-view:${identifier}`,
          120,
          60,
        );
        if (!allowed) throw tooManyRequests("Vượt giới hạn truy cập tệp");

        const data = await storageService.presignViewUrl(body.fileKey);
        return { success: true, data };
      },
      { body: ViewUrlBody },
    ),
  )
  .post(
    "/public-view-url",
    async ({ body, headers, server, request }) => {
      const ip = server?.requestIP(request)?.address;
      const identifier = resolveRequestIdentifier(
        headers as Record<string, string | undefined>,
        ip,
      );
      const allowed = await cache.fixedWindowLimit(
        `ratelimit:public-evidence-view:${identifier}`,
        60,
        60,
      );
      if (!allowed) throw tooManyRequests("Vượt giới hạn truy cập bằng chứng");

      const data = await storageService.presignPublicViewUrl(
        body.caseId,
        body.evidenceId,
      );
      return { success: true, data };
    },
    { body: PublicViewUrlBody },
  );
