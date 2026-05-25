import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { env } from "@/configs";

/**
 * HTTP request logger — chạy cho MỌI request (kể cả 404 không match route).
 * Format: `METHOD url [status] [time]ms`. Bật/tắt qua env HTTP_LOGGING.
 */
@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
    private readonly logger = new Logger("HTTP");
    private readonly enabled = env.HTTP_LOGGING;

    use(req: Request, res: Response, next: NextFunction): void {
        if (!this.enabled) return next();

        const start = Date.now();
        const { method, originalUrl } = req;

        res.on("finish", () => {
            const ms = Date.now() - start;
            const status = res.statusCode;
            const orange = "\x1b[33m";
            const red = "\x1b[31m";
            const green = "\x1b[32m";
            const reset = "\x1b[0m";
            const statusColor = status >= 500 ? red : status >= 400 ? orange : green;
            const line = `${method.toUpperCase()} ${originalUrl} ${statusColor}[${status}]${reset} ${orange}[${ms}ms]${reset}`;
            if (status >= 500) this.logger.error(line);
            else if (status >= 400) this.logger.warn(line);
            else this.logger.log(line);
        });

        next();
    }
}
