import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ArticleService } from './article.service';

@Controller('api/v3/article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  //前端点击按钮请求获取一篇文章
  @Get('obtain') // 访问路径为 'api/v3/article/obtain
  async obtainArticle(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('keyword') keyword?: string,
  ): Promise<any> {
    return await this.articleService.obtainArticle(
      Number(page),
      Number(pageSize),
      keyword,
    );
  }

  //前端点击按钮请求保存一篇文章
  @Post('save') // 访问路径为 'api/v3/article/save
  async saveArticle(@Body() body: any): Promise<any> {
    return await this.articleService.saveArticle(body);
  }
}
