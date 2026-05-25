import "@/common/database/query-builder-augment";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { HttpLoggerMiddleware } from "@/common/middleware";
import { env } from "./configs";

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });

    app.use(cookieParser());
    const httpLogger = new HttpLoggerMiddleware();
    app.use(httpLogger.use.bind(httpLogger));

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );

    const config = new DocumentBuilder()
        .setTitle("NORA VN API")
        .setDescription("NORA VN backend API")
        .setVersion("1.0")
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);

    await app.listen(env.APP_PORT, () => {
        const isProd = env.NODE_ENV === "production";
        console.table({
            [env.NODE_ENV]: {
                APP_PORT: env.APP_PORT,
                DB_HOST: env.DB_HOST,
                DB_DATABASE: env.DB_DATABASE,
            },
        });
    });
}

bootstrap();
