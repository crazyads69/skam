import { Redis } from "@upstash/redis";

export class CacheService {
  private readonly redis: Redis | null;
  private readonly limitFailOpen: boolean;

  constructor() {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    this.redis =
      redisUrl && redisToken
        ? new Redis({ url: redisUrl, token: redisToken })
        : null;
    const defaultFailOpen =
      process.env.NODE_ENV === "production" ? "false" : "true";
    this.limitFailOpen =
      (process.env.CACHE_LIMIT_FAIL_OPEN ?? defaultFailOpen) === "true";
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      return await this.redis.get<T>(key);
    } catch (error) {
      console.warn(
        `cache_get_error key=${key} reason=${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.set(key, value, { ex: ttlSeconds });
    } catch (error) {
      console.warn(
        `cache_set_error key=${key} reason=${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.del(key);
    } catch (error) {
      console.warn(
        `cache_del_error key=${key} reason=${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async fixedWindowLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    if (!this.redis) return this.limitFailOpen;
    try {
      const count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.expire(key, windowSeconds);
      } else {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) await this.redis.expire(key, windowSeconds);
      }
      return count <= limit;
    } catch (error) {
      console.warn(
        `cache_limit_error key=${key} reason=${error instanceof Error ? error.message : String(error)}`,
      );
      return this.limitFailOpen;
    }
  }

  async healthcheck(): Promise<{ enabled: boolean; ok: boolean }> {
    if (!this.redis) return { enabled: false, ok: true };
    const key = `health:cache:${Date.now()}`;
    try {
      await this.redis.set(key, "1", { ex: 10 });
      await this.redis.del(key);
      return { enabled: true, ok: true };
    } catch (error) {
      console.warn(
        `cache_health_error reason=${error instanceof Error ? error.message : String(error)}`,
      );
      return { enabled: true, ok: false };
    }
  }
}

export const cache = new CacheService();
