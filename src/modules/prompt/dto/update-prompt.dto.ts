import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdatePromptDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
