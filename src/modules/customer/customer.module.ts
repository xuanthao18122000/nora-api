import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { Customer } from "./entities/customer.entity";
import { CustomerControllerForCMS } from "./controllers";
import { CustomerService } from "./services/customer.service";

@Module({
    imports: [MikroOrmModule.forFeature([Customer])],
    controllers: [CustomerControllerForCMS],
    providers: [CustomerService],
    exports: [CustomerService],
})
export class CustomerModule {}
