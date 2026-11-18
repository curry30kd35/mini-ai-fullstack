import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

// 模拟一个 PrismaService (Mock)
const mockPrismaService = {
  user: { findFirst: jest.fn() },
  post: { create: jest.fn() },
};

describe('PostService (文章服务)', () => {
  let service: PostService;

  beforeEach(async () => {
    // 每次测试前，初始化一个微型测试环境
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PrismaService, useValue: mockPrismaService }, // 用假的 Prisma 替换真的
      ],
    }).compile();

    service = module.get<PostService>(PostService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // 清除模拟调用的记录
  });

  describe('create (发布文章)', () => {
    const mockDto = { title: '测试文章', content: '内容', authorId: 999 };

    it(' 如果作者不存在，应该抛出 NotFoundException 异常', async () => {
      // 1. 模拟 Prisma 查不到作者（返回 null）
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      // 2. 预期：调用 create 时会抛出 NotFoundException
      await expect(service.create(mockDto, 999)).rejects.toThrow(
        NotFoundException,
      );

      // 3. 断言：因为没查到作者，所以绝对不允许调用 post.create 方法！
      expect(mockPrismaService.post.create).not.toHaveBeenCalled();
    });

    it(' 如果作者存在，应该成功调用 Prisma 并返回结果', async () => {
      // 1. 模拟 Prisma 查到了作者
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 999,
        name: '测试作者',
      });
      mockPrismaService.post.create.mockResolvedValue({ id: 1, ...mockDto });

      // 2. 调用服务
      const result = await service.create(mockDto, 999);

      // 3. 断言：判断返回的数据对不对，判断有没有调用数据库 create 方法
      expect(result.id).toBe(1);
      expect(mockPrismaService.post.create).toHaveBeenCalledTimes(1);
    });
  });
});
