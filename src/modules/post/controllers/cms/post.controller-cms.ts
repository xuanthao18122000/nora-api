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
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PostService } from "../../services/post.service";
import { CreatePostDto } from "../../dtos/create-post.dto";
import { UpdatePostDto } from "../../dtos/update-post.dto";
import { ListPostDto } from "../../dtos/query-post.dto";
import { BulkUpsertPostsDto } from "../../dtos/bulk-upsert-post.dto";

@Controller("cms/posts")
@ApiTags("[CMS] POST")
@ApiBearerAuth()
export class PostControllerForCMS {
    constructor(private readonly postService: PostService) {}

    @Post()
    @ApiOperation({ summary: "Tạo bài viết" })
    create(@Body() dto: CreatePostDto) {
        return this.postService.create(dto);
    }

    @Post("bulk")
    @ApiOperation({
        summary: "Bulk upsert bài viết",
        description:
            "Match theo `slug`: có thì update, không có (hoặc chưa truyền slug) thì create. Field thừa (categoryId, updatedBy, views, publishedAt, author...) sẽ bị bỏ qua.",
    })
    bulkUpsert(@Body() dto: BulkUpsertPostsDto) {
        return this.postService.bulkUpsert(dto);
    }

    @Get()
    @ApiOperation({ summary: "Danh sách bài viết" })
    findAll(@Query() query: ListPostDto) {
        return this.postService.findAll(query);
    }

    @Get(":id")
    @ApiOperation({ summary: "Chi tiết bài viết" })
    findOne(@Param("id", ParseIntPipe) id: number) {
        return this.postService.findOne(id);
    }

    @Patch(":id")
    @ApiOperation({ summary: "Cập nhật bài viết" })
    update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdatePostDto) {
        return this.postService.update(id, dto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Xoá mềm bài viết" })
    remove(@Param("id", ParseIntPipe) id: number) {
        return this.postService.remove(id);
    }
}
