import { Elysia, t } from "elysia";
import { tooManyRequests } from "../../common/error";
import { resolveRequestIdentifier } from "../../common/request-identifier";
import { cache } from "../../services/cache";
import { banksService } from "./service";

export const banksModule = new Elysia({ prefix: "/banks" })
  .get("/", async ({ headers, server, request, set }) => {
    const ip = server?.requestIP(request)?.address;
    const identifier = resolveRequestIdentifier(
      headers as Record<string, string | undefined>,
      ip,
    );

    const allowed = await cache.fixedWindowLimit(
      `ratelimit:banks:list:${identifier}`,
      100,
      60,
    );
    if (!allowed) {
      throw tooManyRequests("Quá nhiều yêu cầu, vui lòng thử lại sau");
    }

    set.headers["cache-control"] =
      "public, max-age=3600, stale-while-revalidate=86400";
    const data = await banksService.listBanks();
    return { success: true, data };
  })
  .get(
    "/search",
    async ({ headers, server, request, query }) => {
      const ip = server?.requestIP(request)?.address;
      const identifier = resolveRequestIdentifier(
        headers as Record<string, string | undefined>,
        ip,
      );

      const allowed = await cache.fixedWindowLimit(
        `ratelimit:banks:search:${identifier}`,
        100,
        60,
      );
      if (!allowed) {
        throw tooManyRequests("Quá nhiều yêu cầu, vui lòng thử lại sau");
      }

      const q = query.q?.trim() ?? "";
      const data = q ? await banksService.searchBanks(q) : await banksService.listBanks();
      return { success: true, data };
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
      }),
    },
  );
