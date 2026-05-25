import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, MinLength } from "class-validator";

export class UpdatePasswordDto {
    @ApiProperty({ description: "Mật khẩu hiện tại" })
    @IsString()
    @Length(1, 200)
    oldPassword!: string;

    @ApiProperty({ description: "Mật khẩu mới (>= 8 ký tự)" })
    @IsString()
    @MinLength(8)
    @Length(8, 200)
    newPassword!: string;
}
