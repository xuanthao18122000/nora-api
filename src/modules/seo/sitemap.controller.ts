import { Controller, Get, Header } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SitemapService } from "./sitemap.service";

@Controller("fe")
@ApiTags("[FE] SEO")
export class SitemapController {
    constructor(private readonly sitemapService: SitemapService) {}

    @Get("sitemap.xml")
    @Header("Content-Type", "application/xml; charset=utf-8")
    @Header("Cache-Control", "public, max-age=3600, s-maxage=3600")
    @ApiOperation({ summary: "Sitemap XML cho Google bot" })
    async sitemap(): Promise<string> {
        return this.sitemapService.buildSitemapXml();
    }

    @Get("robots.txt")
    @Header("Content-Type", "text/plain; charset=utf-8")
    @Header("Cache-Control", "public, max-age=86400, s-maxage=86400")
    @ApiOperation({ summary: "robots.txt cho Google bot" })
    async robots(): Promise<string> {
        return this.sitemapService.buildRobotsTxt();
    }
}
