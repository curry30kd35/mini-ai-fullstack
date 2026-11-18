// src/common/redis.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  public client: Redis;

  onModuleInit() {
    this.client = new Redis({ host: '127.0.0.1', port: 6379 });
    // 加这两行监听事件，连上会打印，连不上会打印错误
    this.client.on('connect', () => {
      console.log('Redis 连接成功！');
    });
    this.client.on('error', (err) => {
      console.error('Redis 连接失败:', err.message);
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  /* *
   * 获取分布式锁
   * @param key 锁名
   * @param value 唯一标识（UUID，防止误删别人的锁）
   * @param expireTime 过期时间（毫秒）
   */
  async lock(key: string, value: string, expireTime = 3000): Promise<boolean> {
    // NX: 只有不存在时才设置, PX: 毫秒级过期
    const result = await this.client.set(key, value, 'PX', expireTime, 'NX');
    return result === 'OK';
  }

  /**
   * 释放分布式锁 (Lua脚本保证原子性，只删除自己加的锁)
   */
  async unlock(key: string, value: string): Promise<boolean> {
    const luaScript = `
      if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.client.eval(luaScript, 1, key, value);
    return result === 1;
  }

  /**
   * 增加排行榜中成员的分数（金额）
   * @param key 排行榜的 key，比如 'rank:orders:total_amount'
   * @param score 增加的金额
   * @param member 成员（这里就是 user_id）
   */
  async addScoreToRank(
    key: string,
    score: number,
    member: string | number,
  ): Promise<void> {
    await this.client.zincrby(key, score, String(member));
  }

  /**
   * 获取排行榜前 N 名（从高到低）
   * @param key 排行榜的 key
   * @param topN 前多少名
   */
  async getTopRank(
    key: string,
    topN = 10,
  ): Promise<{ userId: string; score: number }[]> {
    // withScores: true 表示不仅返回成员，还返回对应的分数
    const result = await this.client.zrevrange(key, 0, topN - 1, 'WITHSCORES');
    const ranks: { userId: string; score: number }[] = [];
    // ioredis 返回的格式是扁平数组: ['user_id_1', '100', 'user_id_2', '80']
    for (let i = 0; i < result.length; i += 2) {
      ranks.push({
        userId: result[i],
        score: Number(result[i + 1]),
      });
    }
    return ranks;
  }
}
