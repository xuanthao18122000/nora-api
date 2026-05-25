import { PickType } from "@nestjs/swagger";
import { CreateFacetDto } from "./create-facet.dto";

export class UpdateFacetDto extends PickType(CreateFacetDto, [
    "label",
    "displayOrder",
    "status",
    "type",
] as const) {}
