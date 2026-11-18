import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Res,
  Patch,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { ChatDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { Throttle } from '@nestjs/throttler'; // 顶部引入

// import { Observable } from 'rxjs';
import { AiService } from './ai.service';

@Controller('api/v3/ai')
@UseGuards(JwtAuthGuard) // 整个 AI 模块全部受 JWT 登录态保护！
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * 生产级流式对话接口
   * 路由：POST /api/v3/ai/chat
   * 注意：使用 @Res() 直接控制底层响应流（会自动绕过 TransformInterceptor）
   */
  @Post('chat')
  @Throttle({ default: { limit: 6, ttl: 60000 } }) // 严格限制：每分钟最多发 6 次 AI 对话！
  @HttpCode(HttpStatus.OK)
  async chat(
    @CurrentUser('id') userId: number,
    @Body() dto: ChatDto,
    @Res() res: Response,
  ) {
    return this.aiService.streamChat(userId, dto, res);
  }

  /**
   * 2. 获取我的历史会话列表
   * GET /api/v3/ai/conversations
   */
  @Get('conversations')
  getConversations(@CurrentUser('id') userId: number) {
    return this.aiService.getConversations(userId);
  }

  /**
   * 3. 获取单个会话的历史消息明细
   * GET /api/v3/ai/conversations/:id/messages
   */
  @Get('conversations/:id/messages')
  getConversationMessages(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    return this.aiService.getConversationMessages(userId, conversationId);
  }

  /**
   * 4. 重命名会话标题
   * PATCH /api/v3/ai/conversations/:id
   */
  @Patch('conversations/:id')
  updateConversationTitle(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) conversationId: number,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.aiService.updateConversationTitle(userId, conversationId, dto);
  }

  /**
   * 5. 软删除会话
   * DELETE /api/v3/ai/conversations/:id
   */
  @Delete('conversations/:id')
  deleteConversation(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    return this.aiService.handlerConversation(userId, conversationId, 'delete');
  }

  /**
   * 5. 恢复会话
   * PATCH /api/v3/ai/conversations/restore/:id
   */
  @Patch('conversations/restore/:id')
  restoreConversation(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    return this.aiService.handlerConversation(
      userId,
      conversationId,
      'restore',
    );
  }
}
