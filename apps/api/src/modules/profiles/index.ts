import { Elysia, t } from "elysia";
import { tooManyRequests } from "../../common/error";
import { resolveRequestIdentifier } from "../../common/request-identifier";
import { cache } from "../../services/cache";
import { profilesService } from "./service";

export const profilesModule = new Elysia({ prefix: "/profiles" }).get(
  "/:identifier",
  async ({ headers, server, request, params, query }) => {
    const ip = server?.requestIP(request)?.address;
    const identifier = resolveRequestIdentifier(
      headers as Record<string, string | undefined>,
      ip,
    );

    const allowed = await cache.fixedWindowLimit(
      `ratelimit:profiles:get:${identifier}`,
      30,
      60,
    );
    if (!allowed) {
      throw tooManyRequests("Quá nhiều yêu cầu, vui lòng thử lại sau");
    }

    const data = await profilesService.getByIdentifier(
      params.identifier,
      query.bankCode,
    );
    return { success: true, data };
  },
  {
    params: t.Object({
      identifier: t.String(),
    }),
    query: t.Object({
      bankCode: t.Optional(t.String()),
    }),
  },
);
