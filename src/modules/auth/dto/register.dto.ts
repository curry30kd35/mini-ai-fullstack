import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不合法' })
  email: string;

  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(2, { message: '用户名至少 2 位' })
  @MaxLength(20, { message: '用户名最多 20 位' })
  name: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度不能少于 6 位' })
  @MaxLength(32, { message: '密码长度不能超过 32 位' })
  password: string;
}
