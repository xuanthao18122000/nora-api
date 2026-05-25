import { RedisModule as NestRedisModule } from "@nestjs-modules/ioredis";
import { Global, Module } from "@nestjs/common";
import { redisConfig } from "@configs/redis.config";
import { RedisService } from "./redis.service";

@Global()
@Module({
    imports: [
        NestRedisModule.forRoot({
            type: "single",
            options: redisConfig,
        }),
    ],
    providers: [RedisService],
    exports: [RedisService],
})
export class RedisModule {}
