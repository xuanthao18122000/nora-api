import { BadRequestException } from "@nestjs/common";

/**
 * Phân loại file theo MIME type — lưu vào File.fileType để FE filter / hiển thị icon.
 */
export function getFileType(mimeType: string): string {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (
        mimeType.includes("pdf") ||
        mimeType.includes("word") ||
        mimeType.includes("excel") ||
        mimeType.includes("powerpoint")
    ) {
        return "document";
    }
    return "other";
}

/** Validate ảnh — dùng cho upload field thumbnail / banner ảnh sản phẩm. */
export function validateImageFile(mimeType: string): void {
    const allowed = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
    ];
    if (!allowed.includes(mimeType)) {
        throw new BadRequestException("Chỉ chấp nhận file hình ảnh (JPEG, PNG, GIF, WEBP, SVG)");
    }
}

/**
 * Sinh tên file unique để tránh ghi đè khi 2 user upload cùng tên.
 * Format: <timestamp>-<random6>.<ext>
 */
export function generateUniqueFileName(originalName: string): string {
    const ext = originalName.includes(".") ? originalName.split(".").pop() : "";
    const random = Math.random().toString(36).slice(2, 8);
    const base = `${Date.now()}-${random}`;
    return ext ? `${base}.${ext}` : base;
}
