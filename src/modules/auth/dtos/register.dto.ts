import { CreateUserDto } from "@modules/user/dtos";

/**
 * Register dùng chung schema với CreateUserDto của UserModule.
 * Tách class riêng để Swagger group đẹp + dễ mở rộng (vd thêm captcha sau).
 */
export class RegisterDto extends CreateUserDto {}
