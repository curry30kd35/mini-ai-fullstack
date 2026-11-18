import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class ChatDto {
  @IsNotEmpty({ message: '提问内容不能为空' })
  @IsString({ message: '提问内容必须是字符串' })
  prompt: string;

  // 可选字段：如果不传，说明是新开启一段对话，后端自动创建新会话；
  // 如果传了，说明是在已有会话里继续追问，后端自动读取该会话的历史上下文！
  @IsOptional()
  @IsInt({ message: '会话 ID 必须是整数' })
  @Min(1)
  conversationId?: number;

  // 【新增】新建对话时可选指定某个预设角色模版 ID
  @IsOptional()
  @IsInt({ message: '角色模版 ID 必须是整数' })
  @Min(1)
  templateId?: number;
}
