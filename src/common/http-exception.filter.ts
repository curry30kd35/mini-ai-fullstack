import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 判断是主动抛出的 HttpException 还是代码崩溃的未知错误
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      // 提取 class-validator 校验管道里的具体中文报错数组
      message =
        typeof res === 'object' && res['message']
          ? Array.isArray(res['message'])
            ? res['message'][0]
            : res['message']
          : exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      code: status,
      message: message,
      data: null,
      path: request.url,
      timestamp: Date.now(),
    });
  }
}
