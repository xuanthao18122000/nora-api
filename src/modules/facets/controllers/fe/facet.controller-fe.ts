import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { FacetFEService } from "../../services/facet-fe.service";

@Controller("fe/facets")
@ApiTags("[FE] FACETS")
export class FacetControllerForFE {
    constructor(private readonly facetFEService: FacetFEService) {}

    @Get()
    @ApiOperation({
        summary:
            "Danh sách facets cho storefront filter. Truyền categoryId để lọc theo category_facets whitelist.",
    })
    async list(@Query("categoryId") categoryId?: string) {
        const id = categoryId != null ? Number(categoryId) : undefined;
        const data = await this.facetFEService.list(
            Number.isFinite(id) ? id : undefined,
        );
        // FE expect envelope `{ data: Facet[] }`
        return { data };
    }
}
