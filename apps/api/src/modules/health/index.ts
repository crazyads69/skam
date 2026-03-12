import { Elysia } from "elysia";
import { db } from "../../db/client";
import { cache } from "../../services/cache";
import { tooManyRequests } from "../../common/error";
import { resolveRequestIdentifier } from "../../common/request-identifier";
import { sql } from "drizzle-orm";

export const healthModule = new Elysia({ prefix: "/health" })
  .get("/", async ({ request, server, headers }) => {
    const ip = server?.requestIP(request)?.address;
    const identifier = resolveRequestIdentifier(
      headers as Record<string, string | undefined>,
      ip,
    );

    const allowed = await cache.fixedWindowLimit(
      `rl:health:${identifier}`,
      60,
      60,
    );
    if (!allowed) throw tooManyRequests("Rate limit exceeded");

    return {
      status: "ok",
      service: "@skam/api",
      timestamp: new Date().toISOString(),
    };
  })
  .get("/ready", async ({ request, server, headers, set }) => {
    const ip = server?.requestIP(request)?.address;
    const identifier = resolveRequestIdentifier(
      headers as Record<string, string | undefined>,
      ip,
    );

    const allowed = await cache.fixedWindowLimit(
      `rl:health:ready:${identifier}`,
      60,
      60,
    );
    if (!allowed) throw tooManyRequests("Rate limit exceeded");

    let dbOk = true;
    try {
      await db.run(sql`SELECT 1`);
    } catch {
      dbOk = false;
    }

    const cacheHealth = await cache.healthcheck();

    const healthy = dbOk && (!cacheHealth.enabled || cacheHealth.ok);

    if (!healthy) {
      set.status = 503;
    }

    return {
      status: healthy ? "ok" : "degraded",
      checks: {
        database: { ok: dbOk },
        cache: cacheHealth,
      },
    };
  });
