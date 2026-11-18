import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
// 引入 Prisma 类型（可选，但为了类型安全建议引入）
import { Post } from '@prisma/client';

@Injectable()
export class ArticleService {
  // 注入全局 Prisma 实例
  constructor(private readonly prisma: PrismaService) {}

  async obtainArticle(
    page: number = 1,
    pageSize: number = 10,
    keyword?: string,
  ): Promise<any> {
    const skip = (page - 1) * pageSize;
    const whereCondition = {
      isDeleted: false,
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword } },
              { email: { contains: keyword } },
            ],
          }
        : {}),
    };

    // 使用 Promise.all 并发查询总数与分页列表
    const [total, list] = await Promise.all([
      this.prisma.user.count({ where: whereCondition }),
      this.prisma.user.findMany({
        where: whereCondition,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          // 连带查出该用户发布的文章数量
          _count: {
            select: { posts: true },
          },
        },
      }),
    ]);
    return { total, page, pageSize, list };
  }

  async saveArticle(body: any): Promise<any> {
    const { content, title, published, authorId } = body;
    // 1. 组装测试数据 (如果你传了 body，就用你传的，否则用下面的测试数据)
    const testData = {
      title: title || 'NestJS 学习笔记第一篇',
      content: content || '这是测试内容：使用 Prisma 成功保存了一篇文章！',
      published: published ?? true,
      // 注意：这里的 1 必须是你 users 表里真实存在的 id
      authorId: authorId || 1,
    };

    try {
      // 2. 使用 Prisma 的 create 方法保存数据
      const newArticle = await this.prisma.post.create({
        data: testData,
        // 如果你想在保存成功后连同作者信息一起返回，可以解开下面这行注释
        // include: { author: true }
      });

      return newArticle;
    } catch (error) {
      // 捕获错误，比如外键不存在时会报错
      throw new Error(`保存文章失败: ${error.message}`);
    }
  }
}
