import { PaginationOptionsDto } from "@common/dtos";
import { Comment } from "../entities/comment.entity";

export class ListRepliesDto extends PaginationOptionsDto<Comment> {}
