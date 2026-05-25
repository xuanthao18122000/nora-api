import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { env } from "@/configs";
import { UserService } from "@modules/user/services/user.service";

export interface JwtPayload {
    sub: number; // user.id
    email: string;
    role: number;
    iat?: number;
    exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
    constructor(private readonly userService: UserService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: env.JWT_SECRET,
        });
    }

    async validate(payload: JwtPayload) {
        // eslint-disable-next-line no-console
        console.log("[JwtStrategy.validate] payload:", payload);
        const user = await this.userService
            .findOne(payload.sub)
            .catch((err) => {
                // eslint-disable-next-line no-console
                console.log(
                    "[JwtStrategy.validate] findOne error:",
                    err?.message,
                );
                return null;
            });
        if (!user) throw new UnauthorizedException("User không tồn tại");

        // Reject token cũ nếu user đã đổi password sau khi token được issue
        if (user.lastRequireLogoutAt && payload.iat) {
            const tokenIssuedAt = new Date(payload.iat * 1000);
            if (tokenIssuedAt < user.lastRequireLogoutAt) {
                throw new UnauthorizedException(
                    "Token đã hết hạn — vui lòng đăng nhập lại",
                );
            }
        }

        // eslint-disable-next-line no-console
        console.log("[JwtStrategy.validate] OK user:", user.id, user.email);
        return user;
    }
}
