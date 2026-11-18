import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateConversationDto {
  @MaxLength(100, { message: '会话标题最多不能超过 100 个字符' })
  @IsString({ message: '会话标题必须是字符串' })
  @IsNotEmpty({ message: '会话标题不能为空' })
  title: string;
}
