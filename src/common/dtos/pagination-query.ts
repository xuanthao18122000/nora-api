import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsDate, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ToBooleanCustom } from "../decorators/transform.decorator";
import { OrderByEnum } from "../enums/common.enum";

export class PaginationOptionsDto<T = unknown> {
    @ApiPropertyOptional({
        minimum: 1,
        default: 1,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page: number = 1;

    @ApiPropertyOptional({
        minimum: 1,
        maximum: 200,
        default: 10,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    @IsOptional()
    limit: number = 10;

    @ApiProperty({
        type: "boolean",
        description: "Lấy toàn bộ dữ liệu không phân trang",
        required: false,
        default: false,
    })
    @IsOptional()
    @ToBooleanCustom()
    @IsBoolean()
    getFull?: boolean;

    @ApiPropertyOptional({
        description: "Tên trường để sắp xếp",
        required: false,
        type: String,
    })
    @IsString()
    @IsOptional()
    sortBy?: keyof T;

    @ApiPropertyOptional({
        description: "Kiểu sắp xếp",
        required: false,
        enum: OrderByEnum,
        enumName: "OrderByEnum",
        default: OrderByEnum.DESC,
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined || value === null) return undefined;
        return typeof value === "string" ? value.toUpperCase() : String(value).toUpperCase();
    })
    @IsEnum(OrderByEnum)
    order?: OrderByEnum;

    @ApiPropertyOptional({
        description: "Thời gian tạo (từ)",
        format: "date",
        required: false,
    })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    createdAtFrom?: Date;

    @ApiPropertyOptional({
        description: "Thời gian tạo (đến)",
        format: "date",
        required: false,
    })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    createdAtTo?: Date;

    @ApiPropertyOptional({
        description: "Thời gian cập nhật (từ)",
        format: "date",
        required: false,
    })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    updatedAtFrom?: Date;

    @ApiPropertyOptional({
        description: "Thời gian cập nhật (đến)",
        format: "date",
        required: false,
    })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    updatedAtTo?: Date;
}
