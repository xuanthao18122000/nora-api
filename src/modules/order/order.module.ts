import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { CustomerModule } from "@modules/customer/customer.module";
import { Product } from "../product/entities/product.entity";
import { Order } from "./entities/order.entity";
import { OrderItem } from "./entities/order-item.entity";
import { OrderControllerForCMS, OrderControllerForFE } from "./controllers";
import { OrderService } from "./services/order.service";

@Module({
    imports: [
        MikroOrmModule.forFeature([Order, OrderItem, Product]),
        CustomerModule,
    ],
    controllers: [OrderControllerForCMS, OrderControllerForFE],
    providers: [OrderService],
    exports: [OrderService],
})
export class OrderModule {}
