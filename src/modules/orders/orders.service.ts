// import {
//   Injectable,
//   BadRequestException,
//   NotFoundException,
//   InternalServerErrorException,
//   ConflictException,
//   Logger,
// } from '@nestjs/common';
// import { DataSource, Repository } from 'typeorm';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Customer } from '../../entities/Customer';
// // import { RedisService } from '../../common/redis.service';
// import { randomUUID } from 'crypto';
// import * as amqp from 'amqplib';

// @Injectable()
// export class OrdersService {
//   constructor(
//     private dataSource: DataSource,
//     @InjectRepository(Customer) private userRepo: Repository<Customer>,
//     // private redisService: RedisService,
//   ) {}

//   //前端点击按钮请求下一个订单然后更新customer用户数据
//   // body 前端传递的 user_id 和 amount 字段 ---悲观锁案例
//   async createOrder(body: any): Promise<any> {
//     const { user_id, amount } = body;

//     // 1. 基础参数校验
//     if (!user_id || !amount || amount <= 0) {
//       throw new BadRequestException(
//         '参数错误：user_id 不能为空，amount 必须大于 0',
//       );
//     }

//     // 2. 开启数据库事务（自动处理 commit 和 rollback）
//     // return await this.dataSource.transaction(async (manager) => {
//     //   // 核心改造：数据库成功后，更新 Redis 排行榜
//     //   // 注意：真实项目中为了防止 Redis 挂了影响主流程，这里最好加 try/catch 包裹，或者用 MQ 异步处理
//     //   try {
//     //     // 3. 根据 user_id 查客户信息，并加上排他锁（FOR UPDATE）
//     //     // 加上锁后，如果同时有第二个请求过来，会在这里排队，直到第一个请求完成
//     //     const customers = await manager.query(
//     //       `SELECT id, name, balance, order_quantity,version FROM customer WHERE user_id = ? FOR UPDATE`,
//     //       [user_id],
//     //     );

//     //     if (customers.length === 0) {
//     //       throw new NotFoundException('找不到该客户信息');
//     //     }

//     //     const customer = customers[0];
//     //     const currentBalance = Number(customer.balance);

//     //     // 4. 校验余额是否充足
//     //     if (currentBalance < amount) {
//     //       throw new BadRequestException(
//     //         `余额不足，当前余额为 ${currentBalance}，需要 ${amount}`,
//     //       );
//     //     }

//     //     // 5. 计算更新后的余额和订单数
//     //     const newBalance = Number((currentBalance - amount).toFixed(2));
//     //     const newOrderQuantity = Number(customer.order_quantity) + 1;

//     //     // 6. 更新 customer 表的余额和订单数量
//     //     await manager.query(
//     //       `UPDATE customer SET balance = ?, order_quantity = ? WHERE user_id = ?`,
//     //       [newBalance, newOrderQuantity, user_id],
//     //     );

//     //     // 7. 向 orders 表插入一条记录
//     //     // 根据你截图里的 orders 表结构，包含 name, balance, order_time 等
//     //     // 这里我们插入 name, 更新后的 balance，以及当前时间
//     //     await manager.query(
//     //       `INSERT INTO orders (name, amount, balance, order_time, goods_name, pay_time, delivery_time) VALUES (?, ?, ?, NOW(), ?, NOW(), NOW())`,
//     //       [customer.name, amount, newBalance, '默认商品名称'],
//     //     );

//     //     const rankKey = 'rank:orders:total_amount';
//     //     // 给当前 user_id 的总金额加上 amount
//     //     await this.redisService.addScoreToRank(rankKey, amount, user_id);

//     //     // 如果你还想记录订单数量排行，再加一行
//     //     // await this.redisService.addScoreToRank('rank:orders:count', 1, user_id);

//     //     // 8. 一切顺利，把前端需要的数据返回
//     //     return {
//     //       success: true,
//     //       message: '下单成功',
//     //       data: {
//     //         name: customer.name,
//     //         order_quantity: newOrderQuantity, // 最新的总订单数
//     //         balance: newBalance, // 最新的余额
//     //         version: customer.version,
//     //       },
//     //     };
//     //   } catch (error) {
//     //     // 如果中途抛出任何异常（比如余额不足），事务会自动回滚，数据库恢复到操作前的状态
//     //     if (
//     //       error instanceof BadRequestException ||
//     //       error instanceof NotFoundException
//     //     ) {
//     //       throw error;
//     //     }
//     //     throw new InternalServerErrorException(`下单失败: ${error.message}`);
//     //   }
//     // });

//     // const connection = await amqp.connect(
//     //   'amqp://admin:admin123@localhost:5672',
//     // );
//     // const channel = await connection.createChannel();

//     // const queue = 'order_queue';
//     // await channel.assertQueue(queue, { durable: true }); // 持久化，防止MQ宕机丢消息

//     // // 构建消息体
//     // const message = JSON.stringify({
//     //   userId: body.user_id,
//     //   goodsName: body.goodsName,
//     //   amount: body.amount,
//     //   createTime: new Date().toISOString(),
//     // });

//     // // 发送到队列（第三个参数 true 表示消息持久化）
//     // channel.sendToQueue(queue, Buffer.from(message), { persistent: true });

//     // await channel.close();
//     // await connection.close();

//     // 瞬间返回给前端，不用等数据库落盘
//     return { code: 202, message: '下单请求已受理，正在排队处理中...' };
//   }

//   // 乐观锁案例：修改 customer 余额
//   async modifyBalance(body: any): Promise<any> {
//     const { user_id, balance, version } = body;
//     return await this.dataSource.transaction(async (manager) => {
//       try {
//         // 核心：去 customer 表更新余额，触发乐观锁
//         const result = await manager.query(
//           `UPDATE customer
//            SET balance = ?, version = version + 1
//            WHERE user_id = ? AND version = ?`,
//           [balance, user_id, version],
//         );

//         // 3. 核心拦截：如果更新失败，说明被别人抢先改了
//         if (result.affectedRows === 0) {
//           throw new ConflictException(
//             '修改失败：数据已被他人修改，请刷新后重试！',
//           );
//         }

//         return {
//           success: true,
//           message: '余额修改成功',
//           balance,
//         };
//       } catch (error) {
//         if (
//           error instanceof ConflictException ||
//           error instanceof NotFoundException
//         ) {
//           throw error;
//         }
//         throw new InternalServerErrorException(`修改失败: ${error.message}`);
//       }
//     });
//   }

//   // 查询余额
//   async checkBalance(user_id: string): Promise<any> {
//     // 直接写 SQL，使用 query 方法
//     const result = await this.dataSource.query(
//       `SELECT balance, version FROM customer WHERE user_id = ? LIMIT 1`,
//       [user_id],
//     );
//     // query 返回的是一个纯数组，取第一个元素的 balance
//     if (result && result.length > 0) {
//       return {
//         balance: result[0].balance,
//         version: result[0].version,
//         code: 200,
//         message: '查询成功',
//       };
//     }
//     return null;
//   }

//   // 查询总消费总数量排行
//   // async checkRank(): Promise<any> {
//   //   // 以下操作只是测试用，开发项目不可用
//   //   // const list = await this.dataSource.query(
//   //   //   `
//   //   //   SELECT
//   //   //   user_id,
//   //   //   MAX(name) AS name, -- 因为按 user_id 分组了，name 取个最大值或者任意值即可
//   //   //   SUM(amount) AS total_amount,
//   //   //   COUNT(*) AS order_count, -- 补上订单总数
//   //   //   -- 在这里使用窗口函数进行排名
//   //   //   RANK() OVER (ORDER BY SUM(amount) DESC) AS rank_num
//   //   //   FROM orders
//   //   //   GROUP BY user_id
//   //   //   `,
//   //   // );

//   //   const rankKey = 'rank:orders:total_amount';

//   //   // 1. 从 Redis 获取前 10 名
//   //   const redisRanks = await this.redisService.getTopRank(rankKey, 10);

//   //   // 2. 如果 Redis 里没数据（比如刚上线或者 Redis 清空了），直接返回空
//   //   if (redisRanks.length === 0) {
//   //     return { list: [], code: 200 };
//   //   }

//   //   // 3. 补全用户信息（关键点！）
//   //   // Redis 里只有 user_id 和 score，没有 name。我们需要去数据库查一次名字。
//   //   // 注意：这里不能用循环去查数据库（N+1 问题），而是用 IN 一次性查出来！
//   //   const userIds = redisRanks.map((r) => r.userId);

//   //   // 这里使用参数化查询，防止 SQL 注入
//   //   const placeholders = userIds.map(() => '?').join(',');
//   //   const users = await this.dataSource.query(
//   //     `SELECT user_id, name FROM customer WHERE user_id IN (${placeholders})`,
//   //     userIds,
//   //   );

//   //   // 把用户信息变成一个字典，方便查找： { '6': '刁民', '7': '张三' }
//   //   const userMap = users.reduce((acc, curr) => {
//   //     acc[curr.user_id] = curr.name;
//   //     return acc;
//   //   }, {});

//   //   // 4. 组装最终返回给前端的数据
//   //   const list = redisRanks.map((item, index) => ({
//   //     rank_num: index + 1, // 排名
//   //     user_id: item.userId,
//   //     name: userMap[item.userId] || '未知用户', // 从字典里取名字
//   //     total_amount: item.score, // 总金额
//   //     // 如果需要订单数，你需要从另一个 Redis ZSet 里取，或者按需补充
//   //   }));
//   //   return {
//   //     list: list || [],
//   //     code: 200,
//   //   };
//   // }

//   // // 模拟 Redis 分布式锁和 Lua脚本防止操作人数过多导致数据库被占满
//   private readonly logger = new Logger(OrdersService.name); //实例化
//   async modifyRedis(body: { user_id: number; amount: number }): Promise<any> {
//     const { user_id, amount } = body;
//     const lockKey = `lock_user_${user_id}`;
//     const uuidv4 = randomUUID(); // 生成一个 v4 UUID
//     const lockValue = uuidv4; // 每次请求生成唯一标识

//     // 1. 抢锁
//     // const acquired = await this.redisService.lock(lockKey, lockValue, 3000);
//     // if (!acquired) {
//     //   // 真实项目中这里可能是返回 429 Too Many Requests
//     //   this.logger.warn(` 用户 ${user_id} 抢锁失败，返回“人数过多”！`);
//     //   throw new BadRequestException('当前人数过多，请稍后再试！');
//     // }

//     // this.logger.log(` 用户 ${user_id} 抢锁成功！开始处理业务...`);
//     // try {
//     //   // 2. 模拟业务处理时间（比如查库、计算）
//     //   await new Promise((resolve) => setTimeout(resolve, 100)); // 模拟耗时

//     //   // 3. 更新数据库（真实情况要用事务）
//     //   const user = await this.userRepo.findOne({ where: { userId: user_id } });
//     //   if (!user) throw new BadRequestException('用户不存在');

//     //   await this.userRepo.update(
//     //     { userId: user_id }, // 条件对象：WHERE user_id = ?
//     //     { balance: String(Number(user.balance) + amount) },
//     //   );
//     //   this.logger.log(
//     //     ` 用户 ${user_id} 余额更新成功，当前余额：${Number(user.balance) + amount}`,
//     //   );
//     //   return {
//     //     code: 200,
//     //     message: '修改成功',
//     //     newBalance: Number(user.balance) + amount,
//     //   };
//     // } finally {
//     //   // 4. 释放锁（一定要放在 finally 中）
//     //   await this.redisService.unlock(lockKey, lockValue);
//     //   this.logger.log(` 用户 ${user_id} 释放锁`);
//     // }
//   }
// }
