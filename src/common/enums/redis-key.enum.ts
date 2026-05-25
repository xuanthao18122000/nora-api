import { env } from "../../configs/env.config";

/**
 * Redis cache keys & TTLs cho noravn-api.
 *
 * Mọi key đều được prepend `REDIS_KEY_PREFIX` (env) để tránh va chạm
 * khi nhiều app dùng chung Redis instance/DB.
 *
 * - PAGE_BY_CODE: cache full page detail (kèm sections + items + posts/products đã enrich)
 *   theo `code` (vd: "home_page", "layout_page"). Clear khi page hoặc section của page
 *   thuộc các code này thay đổi.
 */

const prefix = env.REDIS_KEY_PREFIX ? `${env.REDIS_KEY_PREFIX}:` : "";
const k = (key: string): string => `${prefix}${key}`;

export const RedisKeyEnum = {
    PAGE_BY_CODE: (code: string) => k(`page:by-code:${code}`),
    PAGE_BY_CODE_PATTERN: k("page:by-code:*"),
} as const;

export const RedisTtlEnum = {
    /** 1 ngày = 86400s */
    ONE_DAY: 60 * 60 * 24,
} as const;
