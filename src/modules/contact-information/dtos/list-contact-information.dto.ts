import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationOptionsDto } from "@common/dtos";
import { ContactInformation } from "../entities/contact-information.entity";
import { ContactStatusEnum } from "../enums/contact-status.enum";

export class ListContactInformationDto extends PaginationOptionsDto<ContactInformation> {
    @ApiPropertyOptional({ description: "Search theo name/phone/email" })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: ContactStatusEnum })
    @IsOptional()
    @IsEnum(ContactStatusEnum)
    status?: ContactStatusEnum;
}
