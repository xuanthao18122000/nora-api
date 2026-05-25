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
import { PostListService } from "../../services/post-list.service";
import { CreatePostListDto } from "../../dtos/create-post-list.dto";
import { UpdatePostListDto } from "../../dtos/update-post-list.dto";
import { ListPostListDto } from "../../dtos/query-post-list.dto";

@Controller("cms/post-lists")
@ApiTags("[CMS] POST LIST")
@ApiBearerAuth()
export class PostListControllerForCMS {
    constructor(private readonly service: PostListService) {}

    @Post()
    @ApiOperation({ summary: "Tạo danh sách bài viết" })
    create(@Body() dto: CreatePostListDto) {
        return this.service.create(dto);
    }

    @Get()
    @ApiOperation({ summary: "Danh sách post-lists" })
    findAll(@Query() query: ListPostListDto) {
        return this.service.findAll(query);
    }

    @Get(":id")
    @ApiOperation({ summary: "Chi tiết post-list" })
    findOne(@Param("id", ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Patch(":id")
    @ApiOperation({ summary: "Cập nhật post-list" })
    update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdatePostListDto) {
        return this.service.update(id, dto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Xoá mềm post-list" })
    remove(@Param("id", ParseIntPipe) id: number) {
        return this.service.remove(id);
    }
}
