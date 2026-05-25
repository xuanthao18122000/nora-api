import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Post,
    Query,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PostService } from "../../services/post.service";
import { ListPostDto } from "../../dtos/query-post.dto";

@Controller("fe/posts")
@ApiTags("[FE] POST")
export class PostControllerForFE {
    constructor(private readonly postService: PostService) {}

    @Get()
    @ApiOperation({ summary: "Danh sách bài viết cho storefront" })
    findAll(@Query() query: ListPostDto) {
        return this.postService.findAll(query);
    }

    @Get(":slug")
    @ApiOperation({ summary: "Chi tiết bài viết theo slug" })
    async findBySlug(@Param("slug") slug: string) {
        const post = await this.postService.findBySlug(slug);
        if (!post) throw new NotFoundException(`Post "${slug}" không tồn tại`);
        return post;
    }

    @Post(":slug/views")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Tăng lượt xem (storefront gọi sau khi render)" })
    incrementViews(@Param("slug") slug: string) {
        return this.postService.incrementViews(slug);
    }
}
