import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';

@Injectable()
export class PromptService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. 创建角色模版
   */
  async create(userId: number, userRole: string, dto: CreatePromptDto) {
    // 安全防线：只有 ADMIN 角色才能创建全平台公开模版
    const allowPublic = userRole === Role.ADMIN ? Boolean(dto.isPublic) : false;

    return this.prisma.promptTemplate.create({
      data: {
        title: dto.title,
        description: dto.description,
        systemPrompt: dto.systemPrompt,
        isPublic: allowPublic,
        userId,
      },
    });
  }

  /**
   * 2. 查询可用模版列表（全平台公开模版 + 我自己创建的私有模版）
   */
  async findAll(userId: number) {
    return this.prisma.promptTemplate.findMany({
      where: {
        isDeleted: false,
        OR: [{ isPublic: true }, { userId }],
      },
      orderBy: [
        { isPublic: 'desc' }, // 官方公开模版排在前面
        { updatedAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        description: true,
        systemPrompt: true,
        isPublic: true,
        userId: true,
        updatedAt: true,
      },
    });
  }

  /**
   * 3. 修改我的模版（严格防越权：只能改自己创建的）
   */
  async update(
    userId: number,
    userRole: string,
    id: number,
    dto: UpdatePromptDto,
  ) {
    const template = await this.prisma.promptTemplate.findFirst({
      where: { id, isDeleted: false },
    });

    if (!template) {
      throw new NotFoundException(`角色模版 ID ${id} 不存在`);
    }

    if (template.userId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('无权修改他人创建的预设模版！');
    }

    const updateData: any = { ...dto };
    if (dto.isPublic !== undefined && userRole !== Role.ADMIN) {
      delete updateData.isPublic; // 禁止普通用户提权公开
    }

    return this.prisma.promptTemplate.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * 4. 软删除模版
   */
  async remove(userId: number, userRole: string, id: number) {
    const template = await this.prisma.promptTemplate.findFirst({
      where: { id, isDeleted: false },
    });

    if (!template) {
      throw new NotFoundException(`角色模版 ID ${id} 不存在`);
    }

    if (template.userId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('无权删除他人创建的预设模版！');
    }

    await this.prisma.promptTemplate.update({
      where: { id },
      data: { isDeleted: true },
    });

    return { success: true, message: `模版 ${id} 删除成功` };
  }
}
