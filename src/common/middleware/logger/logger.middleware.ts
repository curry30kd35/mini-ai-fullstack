import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const startTime = Date.now();

    // 监听响应结束事件
    res.on('finish', () => {
      const ms = Date.now() - startTime;
      const { statusCode } = res;
      console.log(
        `[${new Date().toLocaleString('sv-SE', { hour12: false })}] ${method} ${originalUrl} ${statusCode} - ${ms}ms - IP: ${ip}`,
      );
    });

    next(); // 放行，让请求继续往下走
  }
}
