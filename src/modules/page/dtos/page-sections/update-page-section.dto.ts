import { OmitType, PartialType } from "@nestjs/swagger";
import { CreatePageSectionDto } from "./create-page-section.dto";

/**
 * Update info section. Items được update qua endpoint riêng (PUT /sections/:id/items)
 * để tránh phức tạp diff/merge.
 */
export class UpdatePageSectionDto extends PartialType(
    OmitType(CreatePageSectionDto, ["pageId", "items"] as const),
) {}
