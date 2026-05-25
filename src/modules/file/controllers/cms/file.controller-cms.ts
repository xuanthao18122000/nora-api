import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UploadedFile,
    UploadedFiles,
    UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiTags,
} from "@nestjs/swagger";
import { FileService } from "../../services/file.service";
import {
    ListFileDto,
    MarkUsedByPathsDto,
    MarkUsedDto,
    RemoveFilesDto,
} from "../../dtos";

@Controller("cms/files")
@ApiTags("[CMS] FILE")
@ApiBearerAuth()
export class FileControllerForCMS {
    constructor(private readonly fileService: FileService) {}

    @Post("upload")
    @ApiOperation({ summary: "Upload 1 file (push lên CDN server)" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                file: { type: "string", format: "binary" },
            },
        },
    })
    @UseInterceptors(FileInterceptor("file"))
    upload(@UploadedFile() file: Express.Multer.File) {
        return this.fileService.uploadFile(file);
    }

    @Post("uploads")
    @ApiOperation({ summary: "Upload nhiều file (push lên CDN server)" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                files: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                },
            },
        },
    })
    @UseInterceptors(FilesInterceptor("files", 20))
    uploadMany(@UploadedFiles() files: Express.Multer.File[]) {
        return this.fileService.uploadFiles(files);
    }

    @Get()
    @ApiOperation({ summary: "Danh sách file (filter isUsed để tìm file rác)" })
    findAll(@Query() query: ListFileDto) {
        return this.fileService.findAll(query);
    }

    @Get(":id")
    @ApiOperation({ summary: "Chi tiết file" })
    findOne(@Param("id", ParseIntPipe) id: number) {
        return this.fileService.findOne(id);
    }

    @Patch("mark-used")
    @ApiOperation({ summary: "Đánh dấu list file đã được sử dụng (theo id)" })
    async markUsed(@Body() dto: MarkUsedDto) {
        const updated = await this.fileService.markFilesAsUsedByIds(dto.ids);
        return { updated };
    }

    @Patch("mark-used-by-paths")
    @ApiOperation({ summary: "Đánh dấu đã sử dụng theo public path" })
    async markUsedByPaths(@Body() dto: MarkUsedByPathsDto) {
        const updated = await this.fileService.markFilesAsUsedByPaths(dto.paths);
        return { updated };
    }

    @Delete("by-paths")
    @ApiOperation({ summary: "Xoá nhiều file theo path" })
    @HttpCode(HttpStatus.OK)
    removeManyByPaths(@Body() dto: RemoveFilesDto) {
        return this.fileService.removeManyByPaths(dto.paths);
    }

    @Delete("cleanup-unused")
    @ApiOperation({
        summary: "Cleanup file isUsed=false cũ hơn N giờ",
        description: "Mặc định 24h. Có thể chỉnh qua query ?olderThanHours=...",
    })
    @HttpCode(HttpStatus.OK)
    cleanupUnused(@Query("olderThanHours") olderThanHours?: string) {
        return this.fileService.cleanupUnused(olderThanHours ? Number(olderThanHours) : 24);
    }
}
