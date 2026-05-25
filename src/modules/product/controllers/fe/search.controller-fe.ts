import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SearchService } from "../../services/search.service";

@Controller("fe")
@ApiTags("[FE] SEARCH")
export class SearchControllerForFE {
    constructor(private readonly searchService: SearchService) {}

    @Get("search")
    @ApiOperation({
        summary: "Tìm kiếm products + categories theo từ khoá (name/sku/mô tả)",
    })
    search(
        @Query("q") q?: string,
        @Query("productPage") productPage?: string,
        @Query("productLimit") productLimit?: string,
        @Query("categoryPage") categoryPage?: string,
        @Query("categoryLimit") categoryLimit?: string,
        @Query("sort") sort?: string,
    ) {
        return this.searchService.search({
            q: q ?? "",
            productPage: parseIntSafe(productPage),
            productLimit: parseIntSafe(productLimit),
            categoryPage: parseIntSafe(categoryPage),
            categoryLimit: parseIntSafe(categoryLimit),
            sort,
        });
    }

    // Stub endpoints — FE gọi nhưng chưa cần data thật, trả empty.
    // Khi cần (tracking xu hướng), implement riêng.

    @Get("search/initial")
    @ApiOperation({ summary: "Data hiển thị panel search lúc chưa gõ (stub)" })
    initial() {
        return {
            trends: [],
            suggestions: [],
            recommendedProducts: [],
        };
    }

    @Get("search/trends")
    @ApiOperation({ summary: "Từ khoá thịnh hành (stub)" })
    trends(@Query("period") period?: "24h" | "7d") {
        return {
            period: period ?? "24h",
            keywords: [],
            cachedAt: new Date().toISOString(),
        };
    }

    @Get("search/suggestions")
    @ApiOperation({ summary: "Gợi ý từ khoá khi user gõ (stub)" })
    suggestions(@Query("q") _q?: string) {
        return {
            keywords: [],
            cachedAt: new Date().toISOString(),
        };
    }
}

function parseIntSafe(v: string | undefined): number | undefined {
    if (v == null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
}
