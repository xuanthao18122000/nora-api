import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PageCodeEnum } from "../../enums/page.enum";
import { PageService } from "../../services/page.service";

@Controller("pages")
@ApiTags("[FE] PAGE")
export class PageControllerForFE {
    constructor(private readonly pageService: PageService) {}

    @Get("layout")
    @ApiOperation({
        summary: "Lấy trang layout dùng chung (menu, footer, hero banner...)",
        description: "Storefront gọi để lấy sections của trang layout — render header/footer/hero.",
    })
    async getLayout() {
        const page = await this.pageService.findByCode(PageCodeEnum.LAYOUT_PAGE);
        if (!page) throw new NotFoundException(`Layout page chưa được tạo`);
        return page;
    }

    @Get("by-code/:code")
    @ApiOperation({
        summary: "Lấy page theo code (cho trang hệ thống: home_page, layout_page...)",
    })
    async findByCode(@Param("code") code: string) {
        const page = await this.pageService.findByCode(code);
        if (!page) throw new NotFoundException(`Page code "${code}" không tồn tại`);
        return page;
    }

    @Get(":slug")
    @ApiOperation({ summary: "Lấy page theo slug (storefront render)" })
    async findBySlug(@Param("slug") slug: string) {
        const page = await this.pageService.findBySlug(slug);
        if (!page) throw new NotFoundException(`Page "${slug}" không tồn tại`);
        return page;
    }
}
