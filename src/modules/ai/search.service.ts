import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { tavily } from '@tavily/core';

@Injectable()
export class SearchService {
  private tvly: ReturnType<typeof tavily>;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('TAVILY_API_KEY');
    this.tvly = tavily({ apiKey });
  }

  /**
   * 省额度 + 高精准联网检索
   */
  async search(query: string, timeRange: 'day' | 'week' = 'week') {
    const response = await this.tvly.search(query, {
      searchDepth: 'basic', // 1 credit/次，省一半额度
      maxResults: 3, // 取前 3 条精简结果
      timeRange, // 过滤 7 天内网页
      topic: 'general',
      //  已删掉 country: 'china'（它会把未打标的中国站点误杀成 0 条）
      excludeDomains: [
        'facebook.com',
        'instagram.com',
        'twitter.com',
        'x.com',
        'youtube.com',
        'reddit.com',
        'tiktok.com',
      ],
    });

    return response.results;
  }
}
