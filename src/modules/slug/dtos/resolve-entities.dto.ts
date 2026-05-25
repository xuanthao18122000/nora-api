import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsInt,
    ValidateNested,
} from "class-validator";
import { SlugTypeEnum } from "../enums";

export class ResolveEntityItemDto {
    @ApiProperty({ enum: SlugTypeEnum })
    @Type(() => Number)
    @IsEnum(SlugTypeEnum)
    type!: SlugTypeEnum;

    @ApiProperty()
    @Type(() => Number)
    @IsInt()
    entityId!: number;
}

export class ResolveEntitiesDto {
    @ApiProperty({ type: [ResolveEntityItemDto] })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(200)
    @ValidateNested({ each: true })
    @Type(() => ResolveEntityItemDto)
    items!: ResolveEntityItemDto[];
}
