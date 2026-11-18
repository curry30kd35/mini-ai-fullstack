import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPostDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码最小为 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页条数必须是整数' })
  @Min(1, { message: '每页条数最小为 1' })
  pageSize?: number = 10;

  @IsOptional()
  @IsString({ message: '搜索词必须是字符串' })
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  authorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tagId?: number;
}
