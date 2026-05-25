/**
 * Convert chuỗi tiếng Việt → slug (lowercase, dấu gạch ngang, không dấu).
 * Why: dùng cho Category.slug / Product.slug — đảm bảo URL friendly và unique-able.
 */
export function toSlug(input: string): string {
    if (!input) return "";
    return input
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/đ/gi, "d")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}
