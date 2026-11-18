import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'; //  引入守卫
import { CurrentUser } from '../../common/decorators/current-user.decorator'; //  引入自定义装饰器

@Controller('api/v3/post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('release')
  @UseGuards(JwtAuthGuard) //  必须登录才能发帖
  //  从 Token 里安全拿到当前登录人的真实 ID
  create(@Body() dto: CreatePostDto, @CurrentUser('id') currentUserId: number) {
    return this.postService.create(dto, currentUserId);
  }

  @Get('obtain')
  findAll(@Query() query: QueryPostDto) {
    return this.postService.findAll(query);
  }

  @Get('obtain/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postService.findOne(id);
  }

  @Post('with-post')
  createUserWithPost(@Body() createUserDto: CreateUserDto) {
    return this.postService.createWithWelcomePost(createUserDto);
  }
}
