import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy'; //  引入刚才写的策略

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    // 1. 注册基础 Passport 模块，指定默认策略为 'jwt'
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // 2. 异步注册 JwtModule，确保 ConfigService 已经准备好读取 .env
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          // 使用 as any 绕过严格检查
          expiresIn:
            configService.get<string>('JWT_EXPIRES_IN') || ('7d' as any),
        },
      }),
    }),
  ],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
