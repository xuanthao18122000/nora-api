import { PickType } from "@nestjs/swagger";
import { CreateFacetValueDto } from "./create-facet-value.dto";

export class UpdateFacetValueDto extends PickType(CreateFacetValueDto, [
    "key",
    "label",
    "icon",
    "meta",
    "status",
] as const) {}
