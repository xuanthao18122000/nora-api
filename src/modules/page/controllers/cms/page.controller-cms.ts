import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PageService } from "../../services/page.service";
import { CreatePageDto, ListPageDto, UpdatePageDto } from "../../dtos/pages";

@Controller("cms/pages")
@ApiTags("[CMS] PAGE")
@ApiBearerAuth()
export class PageControllerForCMS {
    constructor(private readonly pageService: PageService) {}

    @Post()
    @ApiOperation({ summary: "Tạo trang" })
    create(@Body() dto: CreatePageDto) {
        return this.pageService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: "Danh sách trang" })
    findAll(@Query() query: ListPageDto) {
        return this.pageService.findAll(query);
    }

    @Get(":id")
    @ApiOperation({ summary: "Chi tiết trang (kèm sections + items)" })
    findOne(@Param("id", new ParseUUIDPipe()) id: string) {
        return this.pageService.findOne(id);
    }

    @Patch(":id")
    @ApiOperation({ summary: "Cập nhật trang (info, không sửa sections)" })
    update(@Param("id", new ParseUUIDPipe()) id: string, @Body() dto: UpdatePageDto) {
        return this.pageService.update(id, dto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Xoá trang (cascade xoá sections + items)" })
    remove(@Param("id", new ParseUUIDPipe()) id: string) {
        return this.pageService.remove(id);
    }

    @Post(":id/clear-cache")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Clear Redis cache của trang theo id" })
    clearCache(@Param("id", new ParseUUIDPipe()) id: string) {
        return this.pageService.clearCacheById(id);
    }
}
