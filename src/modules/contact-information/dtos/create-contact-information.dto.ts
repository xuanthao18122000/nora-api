import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    IsEmail,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
    MaxLength,
    Min,
} from "class-validator";
import { ContactStatusEnum } from "../enums/contact-status.enum";

export class CreateContactInformationDto {
    @ApiProperty({ example: "Nguyễn Văn A" })
    @IsNotEmpty()
    @IsString()
    @Length(1, 255)
    name!: string;

    @ApiProperty({ example: "0901234567" })
    @IsNotEmpty()
    @IsString()
    @Length(1, 20)
    phone!: string;

    @ApiPropertyOptional({ example: "nguyenvana@email.com" })
    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    email?: string;

    @ApiPropertyOptional({ example: "123 Đường ABC, Q.1, TP.HCM" })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ example: 123, description: "ID sản phẩm liên quan" })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    productId?: number;

    @ApiPropertyOptional({ example: "Máy lọc nước hồ bơi Hayward" })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    productName?: string;

    @ApiPropertyOptional({ enum: ContactStatusEnum })
    @IsOptional()
    @IsEnum(ContactStatusEnum)
    status?: ContactStatusEnum;

    @ApiPropertyOptional({ example: "Khách hỏi tư vấn lắp đặt" })
    @IsOptional()
    @IsString()
    notes?: string;
}
