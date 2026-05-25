import { PartialType } from "@nestjs/swagger";
import { CreatePostListDto } from "./create-post-list.dto";

export class UpdatePostListDto extends PartialType(CreatePostListDto) {}
