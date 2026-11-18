// src/mq/order.consumer.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { DataSource } from 'typeorm';
import { Orders } from '../entities/Orders';
import { RedisService } from '../common/redis.service';
import { randomUUID } from 'crypto';

// @Injectable()
// export class OrderConsumer implements OnModuleInit {
//   private readonly logger = new Logger(OrderConsumer.name);

//   constructor(
//     private redisService: RedisService,
//     private dataSource: DataSource,
//   ) {}

//   async onModuleInit() {
//     //  修复 1：必须带上 admin 账号密码
//     const connection = await amqp.connect(
//       'amqp://admin:admin123@localhost:5672',
//     );
//     const channel = await connection.createChannel();
//     const queue = 'order_queue';
//     await channel.assertQueue(queue, { durable: true });

//     await channel.prefetch(1);
//     this.logger.log('🐰 MQ消费者启动，等待处理订单...');

//     channel.consume(queue, async (msg) => {
//       if (msg !== null) {
//         const content = JSON.parse(msg.content.toString());
//         const { userId, goodsName, amount } = content;

//         const lockKey = `lock_user_${userId}`;
//         const lockValue = randomUUID();

//         try {
//           const acquired = await this.redisService.lock(
//             lockKey,
//             lockValue,
//             5000,
//           );
//           if (!acquired) {
//             channel.nack(msg, false, true);
//             return;
//           }

//           //  修复 2：使用原生 SQL 查询，避免 TypeORM 的 id / user_id 字段混淆
//           const users = await this.dataSource.query(
//             `SELECT id, name, balance, order_quantity FROM customer WHERE user_id = ? LIMIT 1`,
//             [userId],
//           );

//           if (!users || users.length === 0) {
//             this.logger.error(`用户 ${userId} 不存在`);
//             channel.ack(msg);
//             return;
//           }

//           const user = users[0];
//           if (Number(user.balance) < amount) {
//             this.logger.error(`用户 ${userId} 余额不足`);
//             channel.ack(msg);
//             return;
//           }

//           await this.dataSource.transaction(async (manager) => {
//             // 更新余额和订单数（这里使用原生 SQL，确保更新的是 user_id）
//             await manager.query(
//               `UPDATE customer SET balance = balance - ?, order_quantity = order_quantity + 1 WHERE user_id = ?`,
//               [amount, userId],
//             );

//             // 插入订单表
//             const newOrder = manager.create(Orders, {
//               name: user.name,
//               userId: userId,
//               amount: amount,
//               balance: String(Number(user.balance) - amount),
//               orderTime: new Date(),
//               payTime: new Date(),
//               deliveryTime: new Date(),
//               goodsName: goodsName,
//             });
//             await manager.save(newOrder);
//           });

//           this.logger.log(` 订单处理成功: 用户 ${userId} 购买 ${goodsName}`);
//           channel.ack(msg);
//         } catch (error) {
//           this.logger.error('订单处理异常:', error);
//           channel.nack(msg, false, true);
//         } finally {
//           await this.redisService.unlock(lockKey, lockValue);
//         }
//       }
//     });
//   }
// }
