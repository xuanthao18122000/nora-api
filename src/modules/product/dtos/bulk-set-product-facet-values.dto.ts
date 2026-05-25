import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayUnique, IsArray, IsInt } from "class-validator";

/**
 * Body cho `PUT /cms/products/:productId/facet-values` — replace toàn bộ facet values của product.
 * Mảng rỗng = xoá hết.
 */
export class BulkSetProductFacetValuesDto {
    @ApiProperty({
        description:
            "Danh sách facet value IDs cho product. Replace toàn bộ. " +
            "Mảng rỗng = xoá hết. Trùng lặp sẽ được dedup.",
        type: [Number],
        example: [1, 5, 12],
    })
    @IsArray()
    @ArrayUnique()
    @Type(() => Number)
    @IsInt({ each: true })
    facetValueIds!: number[];
}
