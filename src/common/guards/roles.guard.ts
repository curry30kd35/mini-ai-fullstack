import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. 读取接口方法或控制器类上标记的 @Roles(...)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果接口没有打 @Roles 标记，说明对所有已登录用户放行
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 2. 获取经过 JwtAuthGuard 挂载到请求上的当前用户信息
    const { user } = context.switchToHttp().getRequest();

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('权限不足：该操作仅限管理员（ADMIN）执行！');
    }

    return true;
  }
}
