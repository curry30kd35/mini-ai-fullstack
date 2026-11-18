import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // 拿到当前的请求对象
    const request = context.switchToHttp().getRequest();

    // 提取请求头里的 authorization
    const token = request.headers['authorization'];

    // 这里就是原来你在每个接口里写的 if 判断！
    if (token !== 'your-token-here') {
      throw new UnauthorizedException('无效的 token');
    }

    // 如果你需要校验特定 token，也可以在这里写：
    // if (token !== 'Bearer your-token-here') { throw ... }
    // console.log(`接收到的请求头 token: ${token}`);
    // 返回 true 代表放行，返回 false 代表拦截
    return true;
  }
}
