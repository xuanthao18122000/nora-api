import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { CreatePageSectionItemDto } from "./create-page-section.dto";

/**
 * Thay thế toàn bộ items của section (xoá hết rồi insert lại).
 * Dùng cho thao tác kéo-thả / sắp xếp lại trong CMS.
 */
export class ReplaceSectionItemsDto {
    @ApiProperty({ type: [CreatePageSectionItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePageSectionItemDto)
    items!: CreatePageSectionItemDto[];
}
