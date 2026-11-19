import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateKnowledgeDto {
  @IsNotEmpty({ message: '知识库标题不能为空' })
  @IsString()
  @MaxLength(128, { message: '标题最多 128 个字符' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: '关键词最多 255 个字符' })
  keywords?: string;

  @IsNotEmpty({ message: '知识库正文内容不能为空' })
  @IsString()
  content: string;
}