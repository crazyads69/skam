import { Elysia, t } from "elysia";
import { casesService } from "./service";
import { CreateCaseBody, SearchCaseQuery, PaginateQuery } from "./model";
import { cache } from "../../services/cache";
import { resolveRequestIdentifier } from "../../common/request-identifier";
import { assertAllowedWriteOrigin } from "../../common/request-origin";
import { tooManyRequests } from "../../common/error";

export const casesModule = new Elysia({ prefix: "/cases" })
  .post(
    "/",
    async ({ body, headers, server, request }) => {
      assertAllowedWriteOrigin(headers as Record<string, string | undefined>);
      const ip = server?.requestIP(request)?.address;
      const identifier = resolveRequestIdentifier(
        headers as Record<string, string | undefined>,
        ip,
      );
      const data = await casesService.createCase(body, identifier);
      return { success: true, data };
    },
    { body: CreateCaseBody },
  )
  .get(
    "/search",
    async ({ query, headers, server, request }) => {
      const ip = server?.requestIP(request)?.address;
      const identifier = resolveRequestIdentifier(
        headers as Record<string, string | undefined>,
        ip,
      );
      const allowed = await cache.fixedWindowLimit(
        `ratelimit:search:${identifier}`,
        30,
        60,
      );
      if (!allowed)
        throw tooManyRequests(
          "Bạn đã tìm kiếm quá nhiều, vui lòng thử lại sau",
        );
      return casesService.searchCases(query);
    },
    { query: SearchCaseQuery },
  )
  .get(
    "/recent",
    async ({ query, headers, server, request }) => {
      const ip = server?.requestIP(request)?.address;
      const identifier = resolveRequestIdentifier(
        headers as Record<string, string | undefined>,
        ip,
      );
      const allowed = await cache.fixedWindowLimit(
        `ratelimit:recent:${identifier}`,
        60,
        60,
      );
      if (!allowed)
        throw tooManyRequests(
          "Bạn đã truy cập quá nhiều, vui lòng thử lại sau",
        );
      return casesService.listRecent(query.page, query.pageSize);
    },
    { query: PaginateQuery },
  )
  .get("/:id", async ({ params, headers, server, request }) => {
    const ip = server?.requestIP(request)?.address;
    const identifier = resolveRequestIdentifier(
      headers as Record<string, string | undefined>,
      ip,
    );
    const allowed = await cache.fixedWindowLimit(
      `ratelimit:case:${identifier}`,
      60,
      60,
    );
    if (!allowed)
      throw tooManyRequests("Bạn đã truy cập quá nhiều, vui lòng thử lại sau");
    const data = await casesService.getCaseById(params.id, identifier);
    return { success: true, data };
  });
