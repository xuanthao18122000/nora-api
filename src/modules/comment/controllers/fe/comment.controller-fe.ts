import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CommentService } from "../../services/comment.service";
import {
    CreateCommentDto,
    ListCommentsDto,
    ListRepliesDto,
    ReplyCommentDto,
} from "../../dtos";

@Controller("fe/comments")
@ApiTags("[FE] COMMENT")
export class CommentControllerForFE {
    constructor(private readonly commentService: CommentService) {}

    @Get()
    @ApiOperation({ summary: "Danh sách comment gốc theo target (PRODUCT | CATEGORY)" })
    listRoots(@Query() query: ListCommentsDto) {
        return this.commentService.findRoots(query);
    }

    @Post()
    @ApiOperation({ summary: "Tạo comment gốc (khách)" })
    create(@Body() body: CreateCommentDto) {
        return this.commentService.create(body);
    }

    @Get(":id/replies")
    @ApiOperation({ summary: "Danh sách reply của 1 comment" })
    listReplies(
        @Param("id", new ParseUUIDPipe()) id: string,
        @Query() query: ListRepliesDto,
    ) {
        return this.commentService.findReplies(id, query);
    }

    @Post(":id/replies")
    @ApiOperation({ summary: "Reply comment" })
    reply(
        @Param("id", new ParseUUIDPipe()) id: string,
        @Body() body: ReplyCommentDto,
    ) {
        return this.commentService.reply(id, body);
    }
}
