import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 标记为全局模块，其他模块无需显式 imports 即可直接注入 PrismaService
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
