import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'; //  引入守卫
import { CurrentUser } from '../../common/decorators/current-user.decorator'; //  引入自定义装饰器

@Controller('api/v3/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // 获取所有用户
  // @Get('user-list')
  // @UseGuards(JwtAuthGuard) //  挂上安全锁！没有合法 Token 绝对进不来！
  // getUserList() {
  //   return this.authService.getUserList();
  // }

  /**
   * 登录接口：遵循行业规范，显式返回 200 OK（NestJS POST 默认是 201）
   */
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 放宽可1分钟10次
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard) //  挂上安全锁！没有合法 Token 绝对进不来！
  getProfile(@CurrentUser() user: any) {
    return {
      message: 'Token 验证成功，获取个人信息成功',
      user,
    };
  }
}
