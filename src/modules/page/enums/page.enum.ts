/**
 * Loại trang.
 *  - CUSTOM: trang tự build qua Page Builder (drag-drop blocks).
 *  - SYSTEM: trang hệ thống có cấu trúc cố định (Home, Layout, ...).
 */
export enum PageTypeEnum {
    CUSTOM = "custom",
    SYSTEM = "system",
}

/**
 * Thiết bị hiển thị của PageSection / PageSectionItem.
 *  - MOBILE / DESKTOP / ALL (mặc định).
 */
export enum DeviceTypeEnum {
    MOBILE = "mobile",
    DESKTOP = "desktop",
    ALL = "all",
}

/**
 * Mã định danh các trang hệ thống — gợi ý.
 * Entity lưu kiểu string, có thể thêm/xoá thoải mái không cần migration.
 */
export enum PageCodeEnum {
    HOME_PAGE = "home_page",
    LAYOUT_PAGE = "layout_page",
}

/**
 * Loại section — gợi ý cho FE map sang component nhóm.
 * Entity PageSection.type lưu string, đổi thoải mái.
 */
export enum PageSectionTypeEnum {
    BANNER = "banner",
    PRODUCT = "product",
    TEXT = "text",
    FAQ = "faq",
    LINK_ITEM = "link_item",
}

/**
 * Khoá định danh PageSection — FE dùng key để map sang component cụ thể.
 * Entity PageSection.key lưu string, đổi thoải mái.
 */
export enum PageSectionKeyEnum {
    LAYOUT_MENU = "layout_menu",
    LAYOUT_FOOTER = "layout_footer",

    HERO_BANNER = "hero_banner",
    PROMOTION_GRID = "promotion_grid",
    BESTSELLER = "bestseller",
    NEWS = "news",
    BRAND_SHOWCASE = "brand_showcase",
    BOX_DANH_MUC = "box_danh_muc",
}

/**
 * Loại item trong PageSection — gợi ý cách render từng row.
 * Entity PageSectionItem.type lưu string.
 */
export enum PageSectionItemTypeEnum {
    BANNER = "banner",
    BANNER_SLIDER = "banner_slider",
    LIST_PRODUCTS = "list_products",
    BRAND_LOGO = "brand_logo",
    ARTICLE = "article",
    FAQ = "faq",
    TEXT = "text",
    LINK = "link",
}
