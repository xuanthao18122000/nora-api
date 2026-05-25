import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { SlugResolveService } from "../../services/slug-resolve.service";
import { SlugService } from "../../services/slug.service";

@Controller("fe")
@ApiTags("[FE] SLUG")
export class SlugControllerForFE {
    constructor(
        private readonly slugService: SlugService,
        private readonly slugResolveService: SlugResolveService,
    ) {}

    @Get("resolve")
    @ApiOperation({
        summary: "Resolve slug → page / product / category / post",
        description:
            "Storefront gọi cho mọi route động. Slug rỗng = homepage (lookup PageCode HOME_PAGE).",
    })
    @ApiQuery({ name: "slug", required: false, description: "Slug cần resolve. Để trống = homepage." })
    async resolve(@Query("slug") slug?: string) {
        return this.slugResolveService.resolveSlug(slug ?? "");
    }

    @Get("slugs/:slug")
    @ApiOperation({
        summary: "Lookup slug record → (type, entityId)",
        description: "Endpoint debug — FE thường dùng /fe/resolve để lấy luôn data.",
    })
    async lookup(@Param("slug") slug: string) {
        const found = await this.slugService.findBySlug(slug);
        if (!found) throw new NotFoundException(`Slug "${slug}" không tồn tại`);
        return { type: found.type, entityId: found.entityId, slug: found.slug };
    }
}
