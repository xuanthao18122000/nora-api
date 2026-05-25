import { InjectRedis } from "@nestjs-modules/ioredis";
import { Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService {
    private readonly logger = new Logger(RedisService.name);

    constructor(@InjectRedis() private readonly redis: Redis) {}

    async set(key: string, value: string, ttl?: number): Promise<void> {
        if (ttl) {
            await this.redis.set(key, value, "EX", ttl);
        } else {
            await this.redis.set(key, value);
        }
    }

    async get(key: string): Promise<string | null> {
        return this.redis.get(key);
    }

    async del(key: string): Promise<void> {
        await this.redis.del(key);
    }

    async exists(key: string): Promise<boolean> {
        const result = await this.redis.exists(key);
        return result === 1;
    }

    async ttl(key: string): Promise<number> {
        return this.redis.ttl(key);
    }

    /**
     * SCAN-based bulk delete by pattern. An toàn hơn KEYS trong production.
     */
    async delByPattern(pattern: string): Promise<number> {
        let cursor = "0";
        let deleted = 0;
        do {
            const [next, keys] = await this.redis.scan(cursor, "MATCH", pattern, "COUNT", 200);
            cursor = next;
            if (keys.length > 0) {
                deleted += await this.redis.del(...keys);
            }
        } while (cursor !== "0");
        return deleted;
    }

    /**
     * Helper: try-get JSON. Trả null nếu key không tồn tại hoặc parse fail.
     */
    async getJSON<T>(key: string): Promise<T | null> {
        const raw = await this.redis.get(key);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as T;
        } catch (err) {
            this.logger.warn(`[Redis] getJSON parse fail for key=${key}: ${(err as Error).message}`);
            return null;
        }
    }

    /**
     * Helper: set JSON với TTL (giây).
     */
    async setJSON(key: string, value: unknown, ttl?: number): Promise<void> {
        const raw = JSON.stringify(value);
        await this.set(key, raw, ttl);
    }
}
