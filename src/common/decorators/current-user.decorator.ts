import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import type { User } from "@modules/user/entities/user.entity";

/**
 * Lấy user hiện tại từ JWT đã validate. Yêu cầu route đã có `@UseGuards(JwtAuthGuard)`.
 *
 * @example
 *   @Get("me")
 *   me(@CurrentUser() user: User) { return user; }
 */
export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): User => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);
