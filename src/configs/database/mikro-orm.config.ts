import { EntityCaseNamingStrategy } from "@mikro-orm/core";
import { defineConfig } from "@mikro-orm/mysql";
import { Migrator } from "@mikro-orm/migrations";
import * as path from "path";
import { env } from "../env.config";

export default defineConfig({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    dbName: env.DB_DATABASE,
    entities: ["dist/**/*.entity.js"],
    entitiesTs: ["src/**/*.entity.ts"],
    debug: env.DB_LOGGING,
    forceUtcTimezone: false,
    namingStrategy: EntityCaseNamingStrategy,
    extensions: [Migrator],
    migrations: {
        path: path.join(__dirname, "migrations"),
        pathTs: path.join(__dirname, "migrations"),
        glob: "!(*.d).{js,ts}",
        emit: "ts",
        // So sánh thẳng entity ↔ DB hiện tại (mỗi lần `mikro:generate` query introspection),
        // không lưu/đọc file `.snapshot.json`.
        snapshot: false,
    },
});
