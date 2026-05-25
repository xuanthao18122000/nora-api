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
    Put,
    Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PageSectionService } from "../../services/page-section.service";
import {
    CreatePageSectionDto,
    ListPageSectionDto,
    ReplaceSectionItemsDto,
    UpdatePageSectionDto,
} from "../../dtos/page-sections";

@Controller("cms/page-sections")
@ApiTags("[CMS] PAGE SECTION")
@ApiBearerAuth()
export class PageSectionControllerForCMS {
    constructor(private readonly sectionService: PageSectionService) {}

    @Post()
    @ApiOperation({ summary: "Tạo section + items (nested)" })
    create(@Body() dto: CreatePageSectionDto) {
        return this.sectionService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: "Danh sách section (filter theo pageId/type/key)" })
    findAll(@Query() query: ListPageSectionDto) {
        return this.sectionService.findAll(query);
    }

    @Get(":id")
    @ApiOperation({ summary: "Chi tiết section (kèm items)" })
    findOne(@Param("id", ParseIntPipe) id: number) {
        return this.sectionService.findOne(id);
    }

    @Patch(":id")
    @ApiOperation({ summary: "Cập nhật info section (không sửa items)" })
    update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdatePageSectionDto) {
        return this.sectionService.update(id, dto);
    }

    @Put(":id/items")
    @ApiOperation({
        summary: "Thay thế toàn bộ items của section",
        description: "Dùng cho thao tác kéo-thả / sắp xếp lại — xoá hết rồi insert lại theo DTO.",
    })
    replaceItems(
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: ReplaceSectionItemsDto,
    ) {
        return this.sectionService.replaceItems(id, dto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Xoá section (cascade xoá items)" })
    remove(@Param("id", ParseIntPipe) id: number) {
        return this.sectionService.remove(id);
    }
}
