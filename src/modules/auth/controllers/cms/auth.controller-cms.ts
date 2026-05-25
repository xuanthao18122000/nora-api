import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@common/decorators";
import type { User } from "@modules/user/entities/user.entity";
import { AuthService } from "../../services/auth.service";
import { LoginDto } from "../../dtos/login.dto";
import { RegisterDto } from "../../dtos/register.dto";
import { JwtAuthGuard } from "../../guards";

@Controller("cms/auth")
@ApiTags("[CMS] AUTH")
export class AuthControllerForCMS {
    constructor(private readonly authService: AuthService) {}

    @Post("register")
    @ApiOperation({ summary: "Đăng ký user CMS (gọi qua Swagger / seed)" })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post("login")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Đăng nhập CMS — trả accessToken + user" })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Get("me")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Thông tin user hiện tại (verify token)" })
    me(@CurrentUser() user: User) {
        return user;
    }
}
