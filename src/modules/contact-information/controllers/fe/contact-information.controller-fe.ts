import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateContactInformationDto } from "../../dtos/create-contact-information.dto";
import { ContactInformationService } from "../../services/contact-information.service";

@Controller("fe/contact-informations")
@ApiTags("[FE] CONTACT")
export class ContactInformationControllerForFE {
    constructor(
        private readonly contactInformationService: ContactInformationService,
    ) {}

    @Post()
    @ApiOperation({
        summary: "Để lại thông tin đặt hàng / liên hệ (public)",
        description:
            "API public dành cho FE: nút 'Để lại thông tin đặt hàng' ở trang chi tiết sản phẩm, form liên hệ, v.v. Tự gửi notify Telegram.",
    })
    create(@Body() dto: CreateContactInformationDto) {
        return this.contactInformationService.create(dto);
    }
}
