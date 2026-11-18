import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. 发布文章（实战 Prisma 嵌套连接 Nested Writes）
   */
  async create(dto: CreatePostDto, authorId: number) {
    // 检查作者是否存在
    const author = await this.prisma.user.findFirst({
      where: { id: authorId, isDeleted: false },
    });
    console.log(authorId);

    if (!author) {
      throw new NotFoundException(`作者 ID ${authorId} 不存在`);
    }

    // // 组装 Prisma 创建载荷
    // const data: Prisma.PostCreateInput = {
    //   title: dto.title,
    //   content: dto.content,
    //   // 关联已存在的作者
    //   author: {
    //     connect: { id: dto.authorId },
    //   },
    //   // 如果传了 tagIds，通过 connect 建立与已有标签的多对多绑定关系
    //   ...(dto.tagIds && dto.tagIds.length > 0
    //     ? {
    //         tags: {
    //           connect: dto.tagIds.map((id) => ({ id })),
    //         },
    //       }
    //     : {}),
    // };

    // return this.prisma.post.create({
    //   data,
    //   include: {
    //     author: {
    //       select: { id: true, name: true, email: true }, // 精确投影，绝不查出敏感字段
    //     },
    //     tags: true, // 级联返回文章绑定的标签信息
    //   },
    // });

    // 下面的逻辑中，直接使用参数传进来的 authorId 即可，保证 100% 安全
    const data: Prisma.PostCreateInput = {
      title: dto.title,
      content: dto.content,
      author: {
        connect: { id: authorId },
      },
      ...(dto.tagIds && dto.tagIds.length > 0
        ? {
            tags: {
              connect: dto.tagIds.map((id) => ({ id })),
            },
          }
        : {}),
    };

    return this.prisma.post.create({
      data,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        tags: true,
      },
    });
  }

  /**
   * 2. 高阶动态多条件分页查询
   */
  async findAll(query: QueryPostDto) {
    const { page = 1, pageSize = 10, keyword, authorId, tagId } = query;
    const skip = (page - 1) * pageSize;

    // 动态拼接 where 过滤条件
    const where: Prisma.PostWhereInput = {
      isDeleted: false,
      ...(authorId ? { authorId } : {}),
      ...(tagId ? { tags: { some: { id: tagId } } } : {}), // 核心：多对多查询包含某个 tagId 的文章
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword } },
              { content: { contains: keyword } },
            ],
          }
        : {}),
    };

    // 并发查询总数与列表
    const [total, list] = await Promise.all([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        // 关键优化：精准挑选字段，杜绝全量 select *
        select: {
          id: true,
          title: true,
          content: true,
          published: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true, // 只查作者 ID 和姓名
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return { total, page, pageSize, list };
  }

  /**
   * 3. 查单条详情
   */
  async findOne(id: number) {
    const post = await this.prisma.post.findFirst({
      where: { id, isDeleted: false },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        tags: true,
      },
    });

    if (!post) {
      throw new NotFoundException(`文章 ID ${id} 不存在`);
    }

    return post;
  }

  /**
   * 实战：交互式事务（Interactive Transaction）
   * 业务：创建用户的同时，自动为其生成一篇新手指南文章
   */
  async createWithWelcomePost(dto: CreateUserDto) {
    // 检查邮箱唯一性
    const exist = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exist) {
      throw new ConflictException('该邮箱已经被注册，请更换！');
    }

    // 核心：使用 this.prisma.$transaction 开启事务
    // 注意：在回调函数里，所有数据库操作必须使用参数传进来的 tx（事务客户端），绝不能用 this.prisma！
    return this.prisma.$transaction(async (tx) => {
      // 步骤 1：在事务内创建用户
      const newUser = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
        },
      });

      // 步骤 2：在事务内为该用户创建初始文章
      const welcomePost = await tx.post.create({
        data: {
          title: `欢迎新用户 ${newUser.name} 入驻平台！`,
          content: '这是系统为您自动初始化的第一篇测试文章。',
          authorId: newUser.id, // 使用刚创建出的用户 ID
        },
      });

      // 只要没有抛出异常，所有操作在退出函数时自动原子提交
      return {
        user: newUser,
        welcomePost,
      };
    });
  }
}
