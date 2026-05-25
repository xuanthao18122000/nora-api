import { PartialType } from "@nestjs/swagger";
import { CreateContactInformationDto } from "./create-contact-information.dto";

export class UpdateContactInformationDto extends PartialType(
    CreateContactInformationDto,
) {}
