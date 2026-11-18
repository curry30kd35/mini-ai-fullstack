import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PromptService } from './prompt.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v3/prompt')
@UseGuards(JwtAuthGuard) // 必须登录才能操作角色模版
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  //   创建专属角色模版
  @Post()
  create(
    @CurrentUser() user: { id: number; role: string },
    @Body() dto: CreatePromptDto,
  ) {
    return this.promptService.create(user.id, user.role, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: number) {
    return this.promptService.findAll(userId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { id: number; role: string },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromptDto,
  ) {
    return this.promptService.update(user.id, user.role, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { id: number; role: string },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.promptService.remove(user.id, user.role, id);
  }
}
