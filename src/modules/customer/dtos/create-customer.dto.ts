import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    Length,
} from "class-validator";
import { StatusCommonEnum } from "@common/enums";

export class CreateCustomerDto {
    @ApiProperty({ example: "Nguyễn Văn A" })
    @IsString()
    @Length(1, 255)
    name!: string;

    @ApiProperty({ example: "0901234567" })
    @IsString()
    @Length(8, 20)
    phoneNumber!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    @Length(0, 255)
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ enum: StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    @IsOptional()
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;
}
