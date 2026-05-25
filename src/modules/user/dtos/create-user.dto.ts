import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    Length,
    MinLength,
} from "class-validator";
import { UserRoleEnum, UserStatusEnum } from "../enums";

export class CreateUserDto {
    @ApiProperty({ example: "admin@noravn.com" })
    @IsEmail()
    @Length(1, 200)
    email!: string;

    @ApiProperty({ example: "P@ssw0rd!", description: "Tối thiểu 8 ký tự" })
    @IsString()
    @MinLength(8)
    @Length(8, 200)
    password!: string;

    @ApiProperty({ example: "Nguyễn Văn A" })
    @IsString()
    @Length(1, 200)
    fullName!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 200)
    avatar?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 15)
    phoneNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 500)
    address?: string;

    @ApiPropertyOptional({ enum: UserRoleEnum, default: UserRoleEnum.ADMIN })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(UserRoleEnum)
    role?: UserRoleEnum;

    @ApiPropertyOptional({ enum: UserStatusEnum, default: UserStatusEnum.ACTIVE })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(UserStatusEnum)
    status?: UserStatusEnum;
}
