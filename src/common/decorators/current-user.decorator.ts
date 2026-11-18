import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 自定义装饰器：从经过 JwtAuthGuard 鉴权通过的请求中提取当前用户信息
 * 用法：getProfile(@CurrentUser() user: any)
 * 或者提取单个属性：getProfile(@CurrentUser('id') userId: number)
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // 如果装饰器传入了指定字段（如 @CurrentUser('id')），只返回该字段值
    return data ? user?.[data] : user;
  },
);
