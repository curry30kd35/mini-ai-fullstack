import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  //  核心装饰器：每天凌晨 3:00:00 执行 (Cron 表达式)
  // 为了方便你测试，你也可以先用 @Cron(CronExpression.EVERY_10_SECONDS) 看看效果
  @Cron('0 0 3 * * *')
  //   @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCleanupDrafts() {
    this.logger.log(' 开始执行清理过期草稿任务...');

    // 计算 7 天前的时间点
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 3);

    try {
      // 执行删除
      const result = await this.prisma.post.deleteMany({
        where: {
          published: false, // 未发布
          createdAt: {
            lt: sevenDaysAgo, // 小于3天前
          },
        },
      });

      this.logger.log(` 清理完成！共删除了 ${result.count} 篇过期草稿。`);
    } catch (error) {
      this.logger.error(' 清理草稿失败', error.stack);
    }
  }
}
