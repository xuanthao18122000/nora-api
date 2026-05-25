import { EntityManager } from "@mikro-orm/mysql";
import { Injectable, Logger } from "@nestjs/common";
import { env } from "@/configs";
import { DeletedEnum, StatusCommonEnum } from "@common/enums";
import { Category } from "@modules/category/entities/category.entity";
import { Page } from "@modules/page/entities/page.entity";
import { Post } from "@modules/post/entities/post.entity";
import { Product } from "@modules/product/entities/product.entity";

interface SitemapUrl {
    loc: string;
    lastmod?: Date | string;
    changefreq?: "daily" | "weekly" | "monthly" | "yearly";
    priority?: number;
}

/**
 * Static URL list — tự thêm khi có route mới ở storefront.
 * Mỗi entry là path tương đối với STOREFRONT_URL.
 */
const STATIC_PAGES: { path: string; changefreq: SitemapUrl["changefreq"]; priority: number }[] = [
    { path: "/", changefreq: "daily", priority: 1.0 },
    { path: "/gioi-thieu", changefreq: "monthly", priority: 0.7 },
    { path: "/cuu-ho-ac-quy-24-7", changefreq: "monthly", priority: 0.9 },
    { path: "/lien-he", changefreq: "yearly", priority: 0.5 },
    { path: "/bao-gia-dai-ly", changefreq: "monthly", priority: 0.6 },
    { path: "/stores", changefreq: "monthly", priority: 0.5 },
    { path: "/order-tracking", changefreq: "yearly", priority: 0.4 },
    { path: "/trade-in", changefreq: "monthly", priority: 0.5 },
];

/** Path bot không nên crawl. */
const DISALLOWED_PATHS: string[] = [
    "/admin",
    "/api/",
    "/cart",
    "/checkout",
    "/order-tracking",
    "/account",
    "/search",
];

function isNoIndex(robots: string | null | undefined): boolean {
    if (!robots) return false;
    return /noindex/i.test(robots);
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function toIso(date: Date | string | null | undefined): string | undefined {
    if (!date) return undefined;
    const d = typeof date === "string" ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString();
}

@Injectable()
export class SitemapService {
    private readonly logger = new Logger(SitemapService.name);

    constructor(private readonly em: EntityManager) {}

    /**
     * Build full sitemap.xml gồm:
     *  - STATIC_PAGES (trang tĩnh: home, giới thiệu, cứu hộ...)
     *  - Products active + !noindex
     *  - Categories active + !noindex
     *  - Posts active
     *  - Pages active + isSitemap=true + !noindex
     */
    async buildSitemapXml(): Promise<string> {
        const base = env.STOREFRONT_URL.replace(/\/$/, "");
        const urls: SitemapUrl[] = [];

        // ── 1. Static pages ──────────────────────────────────────────
        const today = new Date().toISOString();
        for (const p of STATIC_PAGES) {
            urls.push({
                loc: `${base}${p.path}`,
                lastmod: today,
                changefreq: p.changefreq,
                priority: p.priority,
            });
        }

        // ── 2. Products ──────────────────────────────────────────────
        const products = await this.em.find(
            Product,
            {
                status: StatusCommonEnum.ACTIVE,
                deleted: DeletedEnum.AVAILABLE,
            },
            { fields: ["slug", "updatedAt", "metaRobots"] as never[] },
        );
        for (const p of products) {
            if (isNoIndex(p.metaRobots)) continue;
            urls.push({
                loc: `${base}/${p.slug}`,
                lastmod: toIso(p.updatedAt),
                changefreq: "weekly",
                priority: 0.8,
            });
        }

        // ── 3. Categories ────────────────────────────────────────────
        const categories = await this.em.find(
            Category,
            {
                status: StatusCommonEnum.ACTIVE,
                deleted: DeletedEnum.AVAILABLE,
            },
            { fields: ["slug", "updatedAt", "metaRobots"] as never[] },
        );
        for (const c of categories) {
            if (isNoIndex(c.metaRobots)) continue;
            urls.push({
                loc: `${base}/${c.slug}`,
                lastmod: toIso(c.updatedAt),
                changefreq: "weekly",
                priority: 0.7,
            });
        }

        // ── 4. Posts ─────────────────────────────────────────────────
        const posts = await this.em.find(
            Post,
            {
                status: StatusCommonEnum.ACTIVE,
                deleted: DeletedEnum.AVAILABLE,
            },
            { fields: ["slug", "updatedAt"] as never[] },
        );
        for (const p of posts) {
            urls.push({
                loc: `${base}/${p.slug}`,
                lastmod: toIso(p.updatedAt),
                changefreq: "monthly",
                priority: 0.6,
            });
        }

        // ── 5. Pages (CMS) ───────────────────────────────────────────
        const pages = await this.em.find(
            Page,
            {
                status: StatusCommonEnum.ACTIVE,
                isSitemap: true,
            },
            { fields: ["slug", "updatedAt", "seoRobots"] as never[] },
        );
        for (const p of pages) {
            if (isNoIndex(p.seoRobots)) continue;
            urls.push({
                loc: `${base}/${p.slug}`,
                lastmod: toIso(p.updatedAt),
                changefreq: "monthly",
                priority: 0.5,
            });
        }

        return this.renderXml(urls);
    }

    /**
     * Build robots.txt — khai báo sitemap + chặn admin/cart/checkout.
     */
    buildRobotsTxt(): string {
        const base = env.STOREFRONT_URL.replace(/\/$/, "");
        const lines = ["User-agent: *", "Allow: /"];
        for (const path of DISALLOWED_PATHS) {
            lines.push(`Disallow: ${path}`);
        }
        lines.push("");
        lines.push(`Sitemap: ${base}/sitemap.xml`);
        return `${lines.join("\n")}\n`;
    }

    private renderXml(urls: SitemapUrl[]): string {
        const head =
            `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n` +
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        const body = urls
            .map((u) => {
                const parts = [`  <url>`, `    <loc>${escapeXml(u.loc)}</loc>`];
                if (u.lastmod) parts.push(`    <lastmod>${u.lastmod}</lastmod>`);
                if (u.changefreq) parts.push(`    <changefreq>${u.changefreq}</changefreq>`);
                if (u.priority !== undefined)
                    parts.push(`    <priority>${u.priority.toFixed(1)}</priority>`);
                parts.push(`  </url>`);
                return parts.join("\n");
            })
            .join("\n");
        const tail = `\n</urlset>\n`;
        return head + body + tail;
    }
}
