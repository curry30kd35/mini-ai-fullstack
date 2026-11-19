import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v3/knowledge')
@UseGuards(JwtAuthGuard, RolesGuard) // 双重守卫：先验 JWT 登录态，再按需验 @Roles 权限
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  /**
   * 1. 普通用户创建自己的【个人私有知识库】
   */
  @Post()
  createPrivate(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateKnowledgeDto,
  ) {
    return this.knowledgeService.create(userId, dto, false);
  }

  /**
   * 2. 【RBAC 核心实战】仅限管理员发布【全企业官方公开知识库】
   * 普通用户（role = USER）访问此接口将直接被 RolesGuard 拦截返回 403 Forbidden！
   */
  @Post('official')
  @Roles(Role.ADMIN)
  createOfficial(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateKnowledgeDto,
  ) {
    return this.knowledgeService.create(userId, dto, true);
  }

  /**
   * 3. 获取我有权查看的知识库列表
   */
  @Get()
  findAll(@CurrentUser('id') userId: number) {
    return this.knowledgeService.findAll(userId);
  }

  /**
   * 4. 软删除知识库文档
   */
  @Delete(':id')
  remove(
    @CurrentUser() user: { id: number; role: string },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.knowledgeService.remove(user.id, user.role, id);
  }
}