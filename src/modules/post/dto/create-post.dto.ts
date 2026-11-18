import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: '文章标题不能为空' })
  @IsString({ message: '标题必须是字符串' })
  @MinLength(2, { message: '标题最少 2 个字' })
  @MaxLength(100, { message: '标题最多 100 个字' })
  title: string;

  @IsOptional()
  @IsString({ message: '文章内容必须是字符串' })
  content?: string;

  // 接收前端传递的标签 ID 数组，如 [1, 2, 3]
  @IsOptional()
  @IsArray({ message: '标签必须为数组格式' })
  @IsInt({ each: true, message: '标签 ID 必须为数字' })
  tagIds?: number[];
}
