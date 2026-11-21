import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'demo@qq.com', description: '登录邮箱' })
  @IsNotEmpty({ message: '登录邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不合法' })
  email: string;

  @ApiProperty({ example: '123456', description: '登录密码' })
  @IsNotEmpty({ message: '登录密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码不能少于 6 位' })
  password: string;
}
