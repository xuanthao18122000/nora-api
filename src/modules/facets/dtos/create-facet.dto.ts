import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { FacetTypeEnum, StatusCommonEnum } from "@common/enums";

export class CreateFacetDto {
    @ApiProperty({ description: "Khóa duy nhất: ram, storage, chipset, usage_need" })
    @IsNotEmpty()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    key!: string;

    @ApiProperty({ description: "Nhãn hiển thị: Dung lượng RAM, Bộ nhớ trong" })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    label!: string;

    @ApiPropertyOptional({ description: "Thứ tự hiển thị", default: 0 })
    @IsOptional()
    @IsInt()
    displayOrder?: number;

    @ApiPropertyOptional({ enum: StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    @IsOptional()
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;

    @ApiPropertyOptional({
        enum: FacetTypeEnum,
        description: "Loại facet: 1=SINGLE_SELECT, 2=MULTI_SELECT, 3=RANGE, 4=BOOLEAN",
        default: FacetTypeEnum.MULTI_SELECT,
    })
    @IsOptional()
    @IsEnum(FacetTypeEnum)
    type?: FacetTypeEnum;
}
