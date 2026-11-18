import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreatePromptDto {
  @IsNotEmpty({ message: '模版标题不能为空' })
  @IsString()
  @MaxLength(64, { message: '模版标题最多 64 个字' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: '描述最多 255 个字' })
  description?: string;

  @IsNotEmpty({ message: '核心系统提示词 (systemPrompt) 不能为空' })
  @IsString()
  systemPrompt: string;

  @IsOptional()
  @IsBoolean({ message: 'isPublic 必须是布尔值' })
  isPublic?: boolean;
}
