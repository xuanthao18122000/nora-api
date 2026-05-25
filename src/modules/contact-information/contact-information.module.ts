import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { CustomerModule } from "@modules/customer/customer.module";
import {
    ContactInformationControllerForCMS,
    ContactInformationControllerForFE,
} from "./controllers";
import { ContactInformation } from "./entities/contact-information.entity";
import { ContactInformationService } from "./services/contact-information.service";

@Module({
    imports: [
        MikroOrmModule.forFeature([ContactInformation]),
        CustomerModule,
    ],
    controllers: [
        ContactInformationControllerForCMS,
        ContactInformationControllerForFE,
    ],
    providers: [ContactInformationService],
    exports: [ContactInformationService],
})
export class ContactInformationModule {}
