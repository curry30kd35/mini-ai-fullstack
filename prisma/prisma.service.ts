import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    // 模块初始化时连接数据库
    await this.$connect();
  }

  async onModuleDestroy() {
    // 应用关闭时优雅断开连接
    await this.$disconnect();
  }
}
