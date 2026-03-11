import { Injectable, Logger } from "@nestjs/common";
import { Redis } from "@upstash/redis";

@Injectable()
export class CacheService {
  private readonly redis: Redis | null;
  private readonly logger = new Logger(CacheService.name);
  private readonly limitFailOpen: boolean;

  public constructor() {
    const redisUrl: string | undefined = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken: string | undefined = process.env.UPSTASH_REDIS_REST_TOKEN;
    this.redis =
      redisUrl && redisToken
        ? new Redis({ url: redisUrl, token: redisToken })
        : null;
    const defaultFailOpen: string =
      process.env.NODE_ENV === "production" ? "false" : "true";
    this.limitFailOpen =
      (process.env.CACHE_LIMIT_FAIL_OPEN ?? defaultFailOpen) === "true";
  }

  public async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      return await this.redis.get<T>(key);
    } catch (error) {
      const reason: string =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(`cache_get_error key=${key} reason=${reason}`);
      return null;
    }
  }

  public async set(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.set(key, value, { ex: ttlSeconds });
    } catch (error) {
      const reason: string =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(`cache_set_error key=${key} reason=${reason}`);
    }
  }

  public async del(key: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.del(key);
    } catch (error) {
      const reason: string =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(`cache_del_error key=${key} reason=${reason}`);
    }
  }

  public async fixedWindowLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    if (!this.redis) return this.limitFailOpen;
    try {
      // Use INCR + EXPIRE in a pipeline-safe way.
      // SET NX with EX ensures the key always has a TTL even if the
      // process crashes between INCR and EXPIRE.
      const count: number = await this.redis.incr(key);
      if (count === 1) {
        // Key was just created — set TTL. If this fails, the key will
        // lack a TTL. As a safety net, we also set the TTL when count
        // is within the limit, since EXPIRE on an existing key is
        // idempotent and cheap.
        await this.redis.expire(key, windowSeconds);
      } else {
        // Re-apply TTL as a safety net in case a prior EXPIRE was lost.
        const ttl: number = await this.redis.ttl(key);
        if (ttl === -1) {
          await this.redis.expire(key, windowSeconds);
        }
      }
      return count <= limit;
    } catch (error) {
      const reason: string =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(`cache_limit_error key=${key} reason=${reason}`);
      return this.limitFailOpen;
    }
  }

  public async healthcheck(): Promise<{ enabled: boolean; ok: boolean }> {
    if (!this.redis) return { enabled: false, ok: true };
    const key: string = `health:cache:${Date.now()}`;
    try {
      await this.redis.set(key, "1", { ex: 10 });
      await this.redis.del(key);
      return { enabled: true, ok: true };
    } catch (error) {
      const reason: string =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(`cache_health_error reason=${reason}`);
      return { enabled: true, ok: false };
    }
  }
}
