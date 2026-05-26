import { EntityRepository, QueryOrder } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { InjectRepository } from "@mikro-orm/nestjs";
import { BadRequestException, HttpException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import axios, { AxiosError } from "axios";
import FormData from "form-data";
import * as path from "path";
import { CDNConfig } from "@/configs/cdn.config";
import { getFileType, paginatedResponse, validateImageFile } from "@common/helpers";
import { File } from "../entities/file.entity";
import { ListFileDto } from "../dtos";

/**
 * NORA VN không phân loại file theo entity → hardcode metadata cho CDN.
 * CDN yêu cầu `object` + `object_id` non-empty trong multipart body.
 */
const CDN_OBJECT = "products";
const CDN_OBJECT_ID = "1";

/**
 * Shape của mỗi item trong `response.data.data` mà CDN upload API trả về.
 * `original` là relative path (vd `files/products/2026/4/20/1/abc.png`),
 * cần ghép với CDN base URL để thành FULL URL lưu vào DB.
 */
interface CDNUploadResult {
    original: string;
}

@Injectable()
export class FileService {
    private readonly logger = new Logger(FileService.name);

    constructor(
        @InjectRepository(File)
        private readonly fileRepo: EntityRepository<File>,
        private readonly em: EntityManager,
    ) {}

    /**
     * Upload 1 file lên CDN server + insert record `files` với isUsed=false.
     * Module khác sau khi gắn file vào entity gọi `markFilesAsUsedByPaths` để mark used.
     */
    async uploadFile(file: Express.Multer.File | undefined): Promise<File> {
        if (!file) throw new BadRequestException("File không được để trống");

        validateImageFile(file.mimetype);

        const cdnPaths = await this.uploadToCDN([file]);
        if (!cdnPaths || cdnPaths.length === 0) {
            throw new HttpException("Upload không thành công, CDN không phản hồi", 500);
        }

        const entity = this.createFileEntity(file, cdnPaths[0]);
        await this.em.persist(entity).flush();
        return entity;
    }

    /**
     * Upload nhiều file lên CDN server.
     */
    async uploadFiles(files: Express.Multer.File[]): Promise<File[]> {
        if (!files?.length) throw new BadRequestException("Files không được để trống");

        for (const file of files) {
            validateImageFile(file.mimetype);
        }

        const cdnPaths = await this.uploadToCDN(files);
        if (!cdnPaths || cdnPaths.length === 0) {
            throw new HttpException("Upload không thành công, CDN không phản hồi", 500);
        }

        const uploaded = files.map((file, index) =>
            this.createFileEntity(file, cdnPaths[index] ?? ""),
        );
        await this.em.persist(uploaded).flush();
        return uploaded;
    }

    /**
     * Tạo File entity từ Multer file + CDN url trả về từ CDN server.
     * Set isUsed=false; cron job sẽ dọn nếu không được entity nào mark used.
     */
    private createFileEntity(file: Express.Multer.File, cdnPath: string): File {
        const fileName = path.basename(cdnPath);
        return this.fileRepo.create({
            originalName: file.originalname,
            fileName,
            path: cdnPath,
            mimeType: file.mimetype,
            size: file.size,
            fileType: getFileType(file.mimetype),
            isUsed: false,
        });
    }

    /**
     * Push files lên CDN server qua HTTP API (multipart/form-data).
     * Trả về list URL public mà CDN trả về để lưu vào DB.
     */
    private async uploadToCDN(files: Express.Multer.File[]): Promise<string[]> {
        if (!files.length) return [];

        const formData = new FormData();

        // Hardcode metadata — noravn không phân loại theo entity, CDN chỉ cần
        // object + object_id non-empty.
        formData.append("object", CDN_OBJECT);
        formData.append("object_id", CDN_OBJECT_ID);

        for (const file of files) {
            formData.append("files", file.buffer, {
                filename: file.originalname,
                contentType: file.mimetype,
            });
        }

        const { uploadUrl, authUuid } = CDNConfig.getUploadConfig();

        try {
            const response = await axios({
                method: "post",
                url: uploadUrl,
                headers: {
                    ...formData.getHeaders(),
                    "Content-Type": "multipart/form-data",
                    "auth-uuid": authUuid,
                },
                data: formData,
                // Cho upload file lớn — match CDN giới hạn ~20MB/file
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            });

            if (!response?.data) {
                throw new HttpException("Upload không thành công, CDN không phản hồi", 500);
            }

            // CDN trả về `data` là mảng object { original: "<relative-path>" }.
            // Ghép `original` với CDN base URL (tránh double slash) để lưu FULL URL.
            const items = (response.data.data as CDNUploadResult[]) ?? [];
            if (!Array.isArray(items)) return [];

            const baseUrl = CDNConfig.getCdnBaseUrl();
            return items
                .map((item) => item?.original)
                .filter(
                    (original): original is string =>
                        typeof original === "string" && original.length > 0,
                )
                .map((original) => {
                    const normalized = original.startsWith("/")
                        ? original.slice(1)
                        : original;
                    return `${baseUrl}/${normalized}`;
                });
        } catch (error: unknown) {
            this.handleAxiosError(error, "Có lỗi xảy ra khi upload file");
        }
    }

    async findAll(query: ListFileDto) {
        const qb = this.em
            .createQueryBuilder(File, "file")
            .fSetQuery(query)
            .fAndWhere("fileType")
            .fAndWhere("isUsed")
            .fAndWhereDateRange("createdAt", query.createdAtFrom, query.createdAtTo)
            .fAddPagination()
            .fAddOrderBy({ id: QueryOrder.DESC });

        if (query.keyword) {
            qb.andWhere({
                $or: [
                    { originalName: { $like: `%${query.keyword}%` } },
                    { fileName: { $like: `%${query.keyword}%` } },
                ],
            });
        }

        const [items, total] = await qb.getResultAndCount();
        return paginatedResponse(items, total, query);
    }

    async findOne(id: number) {
        const file = await this.fileRepo.findOne({ id });
        if (!file) throw new NotFoundException(`File #${id} không tồn tại`);
        return file;
    }

    async findOneByPath(filePath: string) {
        const file = await this.fileRepo.findOne({ path: filePath });
        if (!file) throw new NotFoundException(`File "${filePath}" không tồn tại`);
        return file;
    }

    /** Mark isUsed=true theo list File.id. Trả về số bản ghi update. */
    async markFilesAsUsedByIds(ids: number[]): Promise<number> {
        if (!ids?.length) return 0;
        return this.fileRepo.nativeUpdate({ id: { $in: ids } }, { isUsed: true });
    }

    /** Mark isUsed=true theo list public path (File.path). Hữu ích khi entity chỉ lưu URL. */
    async markFilesAsUsedByPaths(paths: string[]): Promise<number> {
        if (!paths?.length) return 0;
        return this.fileRepo.nativeUpdate({ path: { $in: paths } }, { isUsed: true });
    }

    /**
     * Xoá 1 file: gọi CDN remove API + xoá record DB.
     */
    async removeByPath(filePath: string): Promise<void> {
        const file = await this.fileRepo.findOne({ path: filePath });
        if (!file) return;
        await this.removeFromCDN([file.path]);
        await this.em.removeAndFlush(file);
    }

    /**
     * Xoá nhiều file theo paths: gọi CDN bulk remove + xoá record DB.
     */
    async removeManyByPaths(paths: string[]): Promise<{ removed: number }> {
        if (!paths?.length) return { removed: 0 };
        const files = await this.fileRepo.find({ path: { $in: paths } });
        if (!files.length) return { removed: 0 };

        await this.removeFromCDN(files.map((f) => f.path));
        await this.em.remove(files).flush();
        return { removed: files.length };
    }

    /**
     * Xử lý đổi URL ảnh khi update entity:
     *  - URL cũ khác mới → xoá file cũ
     *  - URL mới khác cũ → mark isUsed
     *
     * Module khác gọi:
     *   await fileService.handleUrlUpdates(product, dto, ['thumbnailUrl', 'iconUrl']);
     */
    async handleUrlUpdates<T extends Record<string, any>>(
        entity: T,
        updateData: Partial<T>,
        urlFields: (keyof T)[],
    ): Promise<void> {
        const pathsToDelete: string[] = [];
        const pathsToMark: string[] = [];

        for (const field of urlFields) {
            const oldUrl = (entity[field] as string | null | undefined) ?? null;
            const newUrl = (updateData[field] as string | null | undefined) ?? null;

            if (oldUrl && oldUrl !== newUrl) pathsToDelete.push(oldUrl);
            if (newUrl && newUrl !== oldUrl) pathsToMark.push(newUrl);
        }

        if (pathsToDelete.length) await this.removeManyByPaths(pathsToDelete);
        if (pathsToMark.length) await this.markFilesAsUsedByPaths(pathsToMark);
    }

    /**
     * Cleanup file isUsed=false cũ hơn N giờ — gọi CDN remove + xoá record.
     * Cron job sẽ gọi. Mặc định N = 24h.
     */
    async cleanupUnused(olderThanHours = 24): Promise<{ removed: number }> {
        const threshold = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
        const orphaned = await this.fileRepo.find({
            isUsed: false,
            createdAt: { $lt: threshold },
        });
        if (!orphaned.length) return { removed: 0 };

        await this.removeFromCDN(orphaned.map((f) => f.path));
        await this.em.remove(orphaned).flush();
        return { removed: orphaned.length };
    }

    /**
     * Gọi CDN remove API. Tự chọn endpoint single vs bulk theo số lượng.
     * Lỗi CDN sẽ được log warning thay vì throw — tránh kẹt flow xoá DB
     * (CDN có thể đã xoá file rồi, hoặc file đã không tồn tại).
     */
    private async removeFromCDN(urls: string[]): Promise<void> {
        if (!urls?.length) return;

        const authUuid = CDNConfig.getAuthUuid();
        const isBulk = urls.length > 1;
        const url = isBulk ? CDNConfig.getRemoveFilesUrl() : CDNConfig.getRemoveFileUrl();
        const data = isBulk ? { urls } : { url: urls[0] };

        try {
            await axios({
                method: "put",
                url,
                headers: {
                    "Content-Type": "application/json",
                    "auth-uuid": authUuid,
                },
                data,
            });
        } catch (error: unknown) {
            // Không throw — record DB vẫn cần được xoá kể cả CDN fail
            const msg = axios.isAxiosError(error)
                ? `${error.response?.status ?? "ERR"} ${JSON.stringify(error.response?.data ?? error.message)}`
                : (error as Error)?.message;
            this.logger.warn(`[FileService] CDN remove failed (${urls.length} files): ${msg}`);
        }
    }

    /**
     * Map axios error → NestJS HttpException với message thân thiện.
     */
    private handleAxiosError(error: unknown, defaultMessage: string): never {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<{ message?: string; data?: unknown }>;

            if (axiosError.response?.status === 413) {
                throw new HttpException("Upload không thành công, kích thước file quá lớn.", 413);
            }

            const responseData = axiosError.response?.data;
            let responseMessage: string | null = null;
            if (responseData) {
                if (typeof responseData === "object" && "message" in responseData) {
                    responseMessage =
                        typeof responseData.message === "string"
                            ? responseData.message
                            : JSON.stringify(responseData.message);
                } else {
                    responseMessage =
                        typeof responseData === "string" ? responseData : JSON.stringify(responseData);
                }
            }
            if (!responseMessage && axiosError.message) responseMessage = axiosError.message;

            const errorMessage = responseMessage
                ? `${defaultMessage}: ${responseMessage}`
                : defaultMessage;
            const statusCode = axiosError.response?.status ?? 500;
            throw new HttpException(errorMessage, statusCode);
        }

        const errorMessage =
            error instanceof Error ? `${defaultMessage}: ${error.message}` : defaultMessage;
        throw new HttpException(errorMessage, 500);
    }
}
