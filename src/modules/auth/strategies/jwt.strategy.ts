import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../prisma/prisma.service';

// 定义昨天签发在 Token 中的 Payload 类型
export interface JwtPayload {
  sub: number; // 用户 ID
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // 1. 告诉 Passport：从请求头的 Authorization: Bearer <Token> 中提取 Token
      //   fromAuthHeaderWithScheme()可以配置任何名称，不区分大小写
      jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('JWT'),
      // 2. 忽略过期：必须设为 false，只要过期直接拒绝
      ignoreExpiration: false,
      // 3. 读取我们在 .env 里配置的 JWT_SECRET 秘钥进行防伪验签
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  /**
   * 验签通过后，Passport 会自动调用这个 validate 方法
   * 返回的对象会被自动挂载到 Express 原生的 Request 对象上：req.user
   */
  async validate(payload: JwtPayload) {
    // 关键安全校验：去数据库核实该用户是否仍然存在，且未被注销/软删除
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        isDeleted: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('令牌有效，但对应用户不存在或已被停用！');
    }

    // 这里的返回值，就是后续可以在 req.user 中拿到的对象
    return user;
  }
}
