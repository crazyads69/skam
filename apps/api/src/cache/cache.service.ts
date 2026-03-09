import { Injectable, Logger } from "@nestjs/common";
import { Redis } from "@upstash/redis";

@Injectable()
export class CacheService {
  private readonly redis: Redis | null;
  private readonly logger = new Logger(CacheService.name);

  public constructor() {
    const redisUrl: string | undefined = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken: string | undefined = process.env.UPSTASH_REDIS_REST_TOKEN;
    this.redis =
      redisUrl && redisToken
        ? new Redis({ url: redisUrl, token: redisToken })
        : null;
  }

  public async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      return await this.redis.get<T>(key);
    } catch (error) {
      const reason: string = error instanceof Error ? error.message : String(error);
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
      const reason: string = error instanceof Error ? error.message : String(error);
      this.logger.warn(`cache_set_error key=${key} reason=${reason}`);
    }
  }

  public async del(key: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.del(key);
    } catch (error) {
      const reason: string = error instanceof Error ? error.message : String(error);
      this.logger.warn(`cache_del_error key=${key} reason=${reason}`);
    }
  }

  public async fixedWindowLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    if (!this.redis) return true;
    try {
      const count: number = await this.redis.incr(key);
      if (count === 1) await this.redis.expire(key, windowSeconds);
      return count <= limit;
    } catch (error) {
      const reason: string = error instanceof Error ? error.message : String(error);
      this.logger.warn(`cache_limit_error key=${key} reason=${reason}`);
      return true;
    }
  }
}
