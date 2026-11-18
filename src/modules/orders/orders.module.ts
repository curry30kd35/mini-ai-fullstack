import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Customer } from '../../entities/Customer';
import { Orders } from '../../entities/Orders'; //  引入你的 Order 实体 (注意路径和大小写)
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { RedisService } from '../../common/redis.service';
// import { OrderConsumer } from '../../mq/order.consumer'; // 确保路径正确

@Module({
  controllers: [OrdersController],
  providers: [OrdersService], //暂时隐藏RedisService  OrderConsumer
  imports: [
    // TypeOrmModule.forFeature([Customer, Orders]), // ← 关键：注册 CustomerRepository
  ],
})
export class OrdersModule {}
