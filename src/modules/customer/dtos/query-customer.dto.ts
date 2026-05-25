import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationOptionsDto } from "@common/dtos";
import { StatusCommonEnum } from "@common/enums";
import { Customer } from "../entities/customer.entity";

export class ListCustomerDto extends PaginationOptionsDto<Customer> {
    @ApiPropertyOptional({ description: "Search theo tên" })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: "Search theo số điện thoại" })
    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @ApiPropertyOptional({ description: "Search theo email" })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({ enum: StatusCommonEnum })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;
}
