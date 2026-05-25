import { BadRequestException } from "@nestjs/common";
import { env } from "./env.config";

/**
 * @description: Cấu hình CDN server (push file qua HTTP API thay vì lưu local disk)
 *
 * Pattern port từ ddv-web-api-v2. Gồm 3 endpoint chính:
 *  - POST  <CDN>/uploads      → upload files (multipart/form-data)
 *  - PUT   <CDN>/remove-file  → xoá 1 file theo url
 *  - PUT   <CDN>/remove-files → xoá nhiều file theo urls
 *
 * Auth: header `auth-uuid: <CDN_UPLOAD_AUTH_UUID>` cho mọi request.
 */
export class CDNConfig {
    /**
     * @description: API paths của CDN server.
     * Lưu ý: `/uploads/` PHẢI có trailing slash — CDN nginx redirect 301 nếu thiếu,
     * và axios POST không tự re-attach multipart body khi follow redirect → upload fail
     * với message "Không tìm thấy file".
     */
    private static readonly API_PATHS = {
        UPLOAD: "/uploads/",
        REMOVE_FILE: "/remove-file",
        REMOVE_FILES: "/remove-files",
    } as const;

    /**
     * @description: Lấy base URL của CDN server (đã strip trailing slash)
     */
    private static getBaseUrl(): string {
        const url = env.CDN_UPLOAD_URL;
        if (!url) {
            throw new BadRequestException("CDN_UPLOAD_URL chưa được cấu hình!");
        }
        return url.endsWith("/") ? url.slice(0, -1) : url;
    }

    /**
     * @description: Build full URL từ base URL và path
     */
    private static buildUrl(p: string): string {
        const baseUrl = this.getBaseUrl();
        const normalizedPath = p.startsWith("/") ? p : `/${p}`;
        return `${baseUrl}${normalizedPath}`;
    }

    /**
     * @description: Lấy URL API upload file
     */
    static getUploadUrl(): string {
        return this.buildUrl(this.API_PATHS.UPLOAD);
    }

    /**
     * @description: Lấy Auth UUID cho CDN (bắt buộc)
     */
    static getAuthUuid(): string {
        const authUuid = env.CDN_UPLOAD_AUTH_UUID;
        if (!authUuid) {
            throw new BadRequestException("CDN_UPLOAD_AUTH_UUID chưa được cấu hình!");
        }
        return authUuid;
    }

    /**
     * @description: Lấy URL API remove file
     */
    static getRemoveFileUrl(): string {
        return this.buildUrl(this.API_PATHS.REMOVE_FILE);
    }

    /**
     * @description: Lấy URL API remove files
     */
    static getRemoveFilesUrl(): string {
        return this.buildUrl(this.API_PATHS.REMOVE_FILES);
    }

    /**
     * @description: Lấy cấu hình đầy đủ cho upload
     */
    static getUploadConfig(): { uploadUrl: string; authUuid: string } {
        return {
            uploadUrl: this.getUploadUrl(),
            authUuid: this.getAuthUuid(),
        };
    }
}
