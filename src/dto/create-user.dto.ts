// dto/create-user.dto.ts
import {
  IsString,
  IsInt,
  Min,
  IsOptional,
  Equals,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  // @Type(() => Number) 配合 transform: true，能自动将 URL query 里的字符串 "1" 转成数字 1

  @IsString()
  @IsNotEmpty()
  // 校验用户名必须是库里
  // @Equals('库里', { message: 'name 必须是“库里”' }) // 关键装饰器
  name: string;

  @IsNotEmpty()
  @IsString()
  sex: string;

  @IsInt()
  @Min(18)
  age: number;

  @IsOptional()
  @IsString()
  email?: string;

  @IsInt()
  @IsNotEmpty()
  sort_id: number;
}
