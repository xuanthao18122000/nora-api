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
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateContactInformationDto } from "../../dtos/create-contact-information.dto";
import { ListContactInformationDto } from "../../dtos/list-contact-information.dto";
import { UpdateContactInformationDto } from "../../dtos/update-contact-information.dto";
import { ContactInformationService } from "../../services/contact-information.service";

@Controller("cms/contact-informations")
@ApiTags("[CMS] CONTACT")
export class ContactInformationControllerForCMS {
    constructor(
        private readonly contactInformationService: ContactInformationService,
    ) {}

    @Get()
    @ApiOperation({ summary: "Danh sách yêu cầu liên hệ" })
    findAll(@Query() query: ListContactInformationDto) {
        return this.contactInformationService.findAll(query);
    }

    @Get(":id")
    @ApiOperation({ summary: "Chi tiết yêu cầu liên hệ" })
    findOne(@Param("id", ParseIntPipe) id: number) {
        return this.contactInformationService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: "Tạo yêu cầu liên hệ" })
    create(@Body() dto: CreateContactInformationDto) {
        return this.contactInformationService.create(dto);
    }

    @Patch(":id")
    @ApiOperation({ summary: "Cập nhật yêu cầu liên hệ" })
    update(
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: UpdateContactInformationDto,
    ) {
        return this.contactInformationService.update(id, dto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Xoá yêu cầu liên hệ" })
    remove(@Param("id", ParseIntPipe) id: number) {
        return this.contactInformationService.remove(id);
    }
}
