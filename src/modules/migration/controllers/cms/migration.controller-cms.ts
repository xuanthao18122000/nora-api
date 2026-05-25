import { Body, Controller, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ImportPayloadDto } from "../../dtos";
import { MigrationService } from "../../services/migration.service";

@Controller("cms/migration")
@ApiTags("[CMS] MIGRATION")
@ApiBearerAuth()
export class MigrationControllerForCMS {
    constructor(private readonly migrationService: MigrationService) {}

    @Post("import")

    import(@Body() payload: ImportPayloadDto) {
        return this.migrationService.import(payload);
    }
}
