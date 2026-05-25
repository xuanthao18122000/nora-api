import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { env } from "@/configs";
import { UserModule } from "@modules/user/user.module";
import { AuthControllerForCMS } from "./controllers";
import { AuthService } from "./services/auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtAuthGuard } from "./guards";

@Module({
    imports: [
        UserModule,
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.register({
            secret: env.JWT_SECRET,
            // `expiresIn` của @types/jsonwebtoken yêu cầu StringValue (vd "1d", "15m") hoặc number;
            // env trả về `string` rộng hơn nên cần cast.
            signOptions: { expiresIn: env.JWT_EXPIRES_IN as unknown as number },
        }),
    ],
    controllers: [AuthControllerForCMS],
    providers: [AuthService, JwtStrategy, JwtAuthGuard],
    exports: [AuthService, JwtAuthGuard, JwtStrategy, PassportModule],
})
export class AuthModule {}
