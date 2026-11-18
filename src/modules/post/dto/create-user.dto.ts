import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: '名称不能为空' })
  @IsString({ message: '名称必须是字符串' })
  @MinLength(2, { message: '标题最少 2 个字' })
  name: string;

  @IsNotEmpty({ message: 'email不能为空' })
  @IsString({ message: 'email必须是字符串' })
  email: string;
}
