import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { PaginationOptionsDto } from "@common/dtos";
import { ToBooleanCustom } from "@common/decorators";
import { File } from "../entities/file.entity";

export class ListFileDto extends PaginationOptionsDto<File> {
    @ApiPropertyOptional({ description: "Search theo originalName / fileName" })
    @IsOptional()
    @IsString()
    keyword?: string;

    @ApiPropertyOptional({ description: "image / video / audio / document / other" })
    @IsOptional()
    @IsString()
    fileType?: string;

    @ApiPropertyOptional({ description: "Filter theo trạng thái sử dụng" })
    @IsOptional()
    @ToBooleanCustom()
    @IsBoolean()
    isUsed?: boolean;
}
