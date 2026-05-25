import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { env } from "@/configs";
import { UserService } from "@modules/user/services/user.service";
import type { User } from "@modules/user/entities/user.entity";
import { UserStatusEnum } from "@modules/user/enums";
import { LoginDto } from "../dtos/login.dto";
import { RegisterDto } from "../dtos/register.dto";
import { JwtPayload } from "../strategies/jwt.strategy";

export interface LoginResponse {
    accessToken: string;
    expiresIn: string;
    user: User;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) {}

    async register(dto: RegisterDto) {
        return this.userService.create(dto);
    }

    async login(dto: LoginDto): Promise<LoginResponse> {
        const user = await this.userService.findByEmail(dto.email);
        if (!user) throw new UnauthorizedException("Email hoặc mật khẩu không đúng");

        const matched = await bcrypt.compare(dto.password, user.password);
        if (!matched) throw new UnauthorizedException("Email hoặc mật khẩu không đúng");

        if (user.status !== UserStatusEnum.ACTIVE) {
            throw new UnauthorizedException("Tài khoản đã bị khoá");
        }

        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        const accessToken = await this.jwtService.signAsync(payload);

        return {
            accessToken,
            expiresIn: env.JWT_EXPIRES_IN,
            user,
        };
    }
}
