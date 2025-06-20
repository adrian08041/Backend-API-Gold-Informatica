import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { OrderProductModule } from './order-product/order-product.module';
import { OrderModule } from './order/order.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [ProductModule, CategoryModule, OrderProductModule, OrderModule, AuthModule, UserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
