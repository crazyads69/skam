import { Injectable } from "@nestjs/common";
import { Redis } from "@upstash/redis";

@Injectable()
export class CacheService {
  private readonly redis: Redis | null;

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
    return this.redis.get<T>(key);
  }

  public async set(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    if (!this.redis) return;
    await this.redis.set(key, value, { ex: ttlSeconds });
  }

  public async del(key: string): Promise<void> {
    if (!this.redis) return;
    await this.redis.del(key);
  }

  public async fixedWindowLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    if (!this.redis) return true;
    const count: number = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, windowSeconds);
    return count <= limit;
  }
}
