import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationOptionsDto } from "@common/dtos";
import { UserRoleEnum, UserStatusEnum } from "../enums";
import { User } from "../entities/user.entity";

export class ListUserDto extends PaginationOptionsDto<User> {
    @ApiPropertyOptional({ description: "Search theo email" })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({ description: "Search theo họ tên" })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiPropertyOptional({ enum: UserRoleEnum })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(UserRoleEnum)
    role?: UserRoleEnum;

    @ApiPropertyOptional({ enum: UserStatusEnum })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(UserStatusEnum)
    status?: UserStatusEnum;
}
