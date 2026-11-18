import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { OrdersModule } from './modules/orders/orders.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ArticleModule } from './modules/article/article.module';
import { PostModule } from './modules/post/post.module';
import { AuthModule } from './modules/auth/auth.module';
import { LoggerMiddleware } from './common/middleware/logger/logger.middleware';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './common/tasks.service';
import { AiModule } from './modules/ai/ai.module';
import { PromptModule } from './modules/prompt/prompt.module';

@Module({
  imports: [
    UserModule,
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }), // 全局加载 .env
    // TypeOrmModule.forRootAsync({
    //   inject: [ConfigService], // 注入 ConfigService
    //   useFactory: async (configService: ConfigService) => ({
    //     type: 'mysql', // 数据库类型
    //     host: configService.get<string>('DB_HOST', 'localhost'), //数据库地址 第二个参数是默认值
    //     port: configService.get<number>('DB_PORT', 3306), // 数据库端口
    //     username: configService.get<string>('DB_USERNAME'), // 数据库用户名
    //     password: configService.get<string>('DB_PASSWORD'), // 数据库密码
    //     database: configService.get<string>('DB_DATABASE'), // 数据库名称
    //     entities: [User], // 注册实体
    //     autoLoadEntities: true, //开启自动加载，这样 forFeature 里注册了啥，它就加载啥
    //     synchronize: false, // 自动建表 (仅限开发环境)---synchronize: true 仅在开发环境使用，它会自动根据实体创建或修改表结构。生产环境必须设为 false，否则可能导致数据丢失
    //     dateStrings: true, // 核心：让驱动直接返回 'YYYY-MM-DD HH:mm:ss' 字符串
    //     timezone: '+08:00', // 加上这个，防止服务器和数据库时区不一致导致差 8 小时
    //   }),
    // }),
    // TypeOrmModule.forFeature([User]),
    OrdersModule,
    PostModule,
    ArticleModule,
    AuthModule,
    // 配置限流规则：60秒内最多20次
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 毫秒
        limit: 20, // 次数
      },
    ]),
    ScheduleModule.forRoot(),
    AiModule,
    PromptModule, // 开启定时任务调度
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    TasksService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // 对所有路由开启日志记录
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
