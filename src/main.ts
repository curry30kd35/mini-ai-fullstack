process.env.TZ = 'Asia/Shanghai'; //  配置环境时区，让 Prisma 自动纠偏
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'; //  引入 Express 类型
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path'; //  2. 引入 path.join
import { TransformInterceptor } from './interceptors/transform.interceptor'; // 引入post请求拦截器
import { HttpExceptionFilter } from './common/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
async function bootstrap() {
  // 1. 底层默认基于 Express，通过 Nest 工厂创建应用实例，并加载根模块 AppModule
  // const app = await NestFactory.create(AppModule);
  // 3. 声明使用 NestExpressApplication
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // 4. 挂载根目录下的 public 文件夹作为静态页面托管（访问根路径 / 自动打开 public/index.html）
  app.useStaticAssets(join(process.cwd(), 'public'));
  // 【新增配置】设置全局路由前缀--测试用
  // app.setGlobalPrefix('api/v1/users');
  // 开启 CORS，允许所有来源访问（开发环境方便）
  // 配置企业级 CORS 跨域放行，迎接前端联调
  app.enableCors({
    // origin: true 表示自动反射请求的 Origin，开发和调试极其方便；
    // 真实上线后可改为读环境变量的域名数组，如 ['https://your-domain.com']
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    // 必须显式允许 Authorization 头，否则前端携带 JWT Token 的预检请求会被直接拦截！
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });
  // 关键：全局开启校验
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动剥离 DTO 里没定义的字段
      forbidNonWhitelisted: true, // 传了多余字段直接报错
      transform: true, // 自动类型转换,自动把 URL query 或 body 里的数据转为 DTO 声明的真实类型（如 string 自动转 number）
    }),
  );
  // 挂载全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor()); // 全局注册拦截器，拦截post请求，统一返回格式
  // 挂载全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  //  2. 配置 Swagger（放在 setGlobalPrefix 之后，默认挂载在根路径 /docs，不冲突）
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mini AI 全栈智能工作台 API 文档')
    .setDescription('NestJS + Prisma + MySQL 企业级后端服务接口文档')
    .setVersion('3.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
        description: '请填入：jwt 你的accessToken（注意 jwt 后面有一个空格）',
      },
      'jwt-auth',
    )
    // 【新增这 1 行】全局强制所有接口启用 'jwt-auth'，再也不用每个控制器手写 @ApiSecurity！
    .addSecurityRequirements('jwt-auth')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, documentFactory, {
    swaggerOptions: {
      // 开启持久化：刷新 /docs 页面也不用重新粘贴 Token！
      persistAuthorization: true,
    }
  });

  // 关闭 Express 默认的 ETag 功能---关闭浏览器缓存，暂时统一请求状态码200，方便前端调试
  app.getHttpAdapter().getInstance().set('etag', false);
  // 2. 监听 3000 端口
  // await app.listen(process.env.PORT ?? 3000);

  const port = configService.get<number>('PORT') || 3000;
  // 5. 【关键】必须显式绑定到 '0.0.0.0'，否则部署到 Render 后外网无法访问！
  await app.listen(port, '0.0.0.0');
}
bootstrap();
