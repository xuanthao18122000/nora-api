import "dotenv/config";
import { z } from "zod";

const booleanSchema = z
    .string()
    .optional()
    .transform((val) => {
        if (!val) return false;
        return val.toLowerCase() === "true" || val === "1" || val.toLowerCase() === "yes";
    })
    .pipe(z.boolean());

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "staging", "production", "test"]).default("development"),
    APP_PORT: z.coerce.number().default(3000),
    API_URL: z.string().default("http://localhost:3000"),
    /** Public storefront URL — dùng để build absolute URL trong sitemap.xml. */
    STOREFRONT_URL: z.string().default("https://noravn.com"),

    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().default(3306),
    DB_USERNAME: z.string().min(1),
    DB_PASSWORD: z.string().default(""),
    DB_DATABASE: z.string().min(1),
    DB_LOGGING: booleanSchema.default(false),

    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default("1d"),

    /**
     * Public CDN URL prefix dùng để build display URL trong response (read side).
     * Vd `https://cdn-v2.didongviet.vn`.
     */
    CDN_URL: z.string().default(""),
    /**
     * CDN upload server URL — endpoint để push file qua HTTP API (write side).
     * Vd `https://origin-cdn-v2.didongviet.vn/`.
     */
    CDN_UPLOAD_URL: z.url(),
    /** Auth UUID gửi qua header `auth-uuid` khi gọi CDN upload/remove API. */
    CDN_UPLOAD_AUTH_UUID: z.string().min(1),

    /** Bật log mỗi HTTP request (method, url, status, time). */
    HTTP_LOGGING: booleanSchema.default(true),

    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional().default(""),
    REDIS_DB: z.coerce.number().default(0),
    /**
     * Namespace prefix gắn vào mọi Redis key của app này.
     * Dùng khi nhiều app chia sẻ chung Redis instance/DB để tránh va chạm key.
     * Vd: `noravn` → key thật `noravn:page:by-code:home_page`.
     * Để trống = không thêm prefix (giữ hành vi cũ).
     */
    REDIS_KEY_PREFIX: z.string().optional().default(""),

    /** Telegram bot — optional, để trống để tắt notify. */
    TELEGRAM_BOT_TOKEN: z.string().optional().default(""),
    TELEGRAM_CHAT_ID: z.string().optional().default(""),
});

const parseEnv = () => {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        console.error("❌ Invalid environment variables:");
        console.error(JSON.stringify(z.treeifyError(parsed.error), null, 2));
        throw new Error("Invalid environment variables");
    }
    return parsed.data;
};

export const env = parseEnv();
export type Env = typeof env;

export const isDevelopment = (): boolean => env.NODE_ENV === "development";
export const isProduction = (): boolean => env.NODE_ENV === "production";
