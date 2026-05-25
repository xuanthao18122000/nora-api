import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateUserDto } from "./create-user.dto";

/**
 * Update user — không sửa password qua endpoint này.
 * Dùng UpdatePasswordDto riêng (an toàn hơn, có check old password).
 */
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ["password"] as const)) {}
