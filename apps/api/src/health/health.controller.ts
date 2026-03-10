import {
  Controller,
  Get,
  HttpException,
  Req,
  ServiceUnavailableException,
} from "@nestjs/common";
import { CacheService } from "../cache/cache.service";
import { PrismaService } from "../database/prisma.service";
import { resolveRequestIdentifier } from "../common/request-identifier";

interface HealthResponse {
  status: "ok";
  service: string;
  timestamp: string;
}

interface ReadyResponse extends HealthResponse {
  checks: {
    database: "ok" | "error";
    cache: "ok" | "error" | "disabled";
  };
}

@Controller("health")
export class HealthController {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  @Get()
  public async getHealth(
    @Req()
    request: {
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    },
  ): Promise<HealthResponse> {
    const identifier: string = resolveRequestIdentifier(request);
    const allowed: boolean = await this.cache.fixedWindowLimit(
      `ratelimit:health:${identifier}`,
      60,
      60,
    );
    if (!allowed) throw new HttpException("Vượt giới hạn", 429);
    return {
      status: "ok",
      service: "@skam/api",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("ready")
  public async getReady(): Promise<ReadyResponse> {
    const cache = await this.cache.healthcheck();
    let databaseOk: boolean = true;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      databaseOk = false;
    }
    const cacheStatus: "ok" | "error" | "disabled" = cache.enabled
      ? cache.ok
        ? "ok"
        : "error"
      : "disabled";
    if (!databaseOk || (cache.enabled && !cache.ok)) {
      throw new ServiceUnavailableException({
        status: "error",
        service: "@skam/api",
        timestamp: new Date().toISOString(),
        checks: {
          database: databaseOk ? "ok" : "error",
          cache: cacheStatus,
        },
      });
    }
    return {
      status: "ok",
      service: "@skam/api",
      timestamp: new Date().toISOString(),
      checks: {
        database: "ok",
        cache: cacheStatus,
      },
    };
  }
}
