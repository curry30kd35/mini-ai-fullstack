import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators'; // 引入 tap

export interface Response<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    // next.handle() 会去执行你的 Controller 和 Service
    // .pipe(tap(...)) 表示：如果它们顺利执行完了，没报错，才会进入 tap 里面的逻辑
    return next.handle().pipe(
      tap(() => {
        // 只有当 Controller 顺利返回数据，走到这里时，才修改状态码
        if (
          request.method === 'POST' &&
          response.statusCode === HttpStatus.CREATED
        ) {
          response.status(HttpStatus.OK);
        }
      }),
      map((data) => ({
        code: 200,
        message: 'success',
        data: data ?? null,
        timestamp: Date.now(),
      })),
    );
  }
}
