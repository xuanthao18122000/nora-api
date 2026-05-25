import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, ArrayUnique, IsArray, IsString, Length } from "class-validator";

export class RemoveFileDto {
    @ApiProperty({
        description: "CDN URL của file (File.path)",
        example: "https://cdn-v2.didongviet.vn/product/123/abc.png",
    })
    @IsString()
    @Length(1, 500)
    path!: string;
}

export class RemoveFilesDto {
    @ApiProperty({ description: "Danh sách path", type: [String] })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayUnique()
    @IsString({ each: true })
    paths!: string[];
}

export class MarkUsedDto {
    @ApiProperty({ description: "Danh sách File.id cần mark isUsed=true", type: [Number] })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayUnique()
    ids!: number[];
}

export class MarkUsedByPathsDto {
    @ApiProperty({ description: "Danh sách path", type: [String] })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayUnique()
    @IsString({ each: true })
    paths!: string[];
}
