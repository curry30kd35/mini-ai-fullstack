import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Headers,
  HttpCode,
  UnauthorizedException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from './dto/auth.guard'; // 引入刚才写的校验守卫
import { SkipThrottle } from '@nestjs/throttler';

@Controller('api/v3') // 在这里定义属于 Users 的路径
export class AppController {
  constructor(private readonly appService: AppService) {}

  //get请求配置对应的接口路由---通过id传递参数，
  @Get('visit/:id') // 访问路径为 /api/v1/users/visit/123
  @UseGuards(AuthGuard) // 使用保安守卫---如果authorization不符合要求，就会被拦截
  getHello(@Param('id') id: string): string {
    return this.appService.getHello(id);
  }

  // get请求配置对应的接口路由---通过query传递参数
  @Get('list') // 访问路径为 /api/v1/users/list?page=1&pageSize=10&keyword=张三
  @UseGuards(AuthGuard) // 使用保安守卫---如果authorization不符合要求，就会被拦截
  async getUserList(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('keyword') keyword?: string,
  ) {
    // console.log(`页码: ${page}, 每页条数: ${pageSize}, 搜索词: ${keyword}`);

    // 先模拟返回假数据，后面学了数据库再替换
    // return this.appService.getUserList(page, pageSize, keyword);
    // 真实查询：从数据库的 users 表中取出所有记录
    //  把参数传给 Service，注意把 page 和 pageSize 转成 Number 类型
    const result = await this.appService.getUserList(
      Number(page),
      Number(pageSize),
      keyword,
    );
    // console.log('查询结果:', result); // 打印查询结果，方便调试
    // Service 会直接返回包含 total 和 list 的对象
    return result;
  }

  // post请求配置对应的接口路由---通过body传递参数
  @Post('create') // 访问路径为 /api/v1/users/create
  // @HttpCode(200) // 显式声明成功创建的 HTTP 状态码为 200 Created
  async getMessageObject(@Body() createUserDto: CreateUserDto): Promise<any> {
    console.log('收到的请求体:', createUserDto);
    return await this.appService.createUser(createUserDto); // 调用了你 Service 里的插入方法往数据库增加一条数据
  }

  /**
   * 全量/部分修改用户信息
   * 前端请求：PATCH /api/v1/users/1001
   * 请求体 JSON: { "name": "新名字" }
   */
  @Patch('edit/:id')
  updateUser(@Param('id') id: string, @Body() updateData: Record<string, any>) {
    console.log(`更新的内容为:目标ID: ${id}`, updateData);
    return this.appService.updateUser(id, updateData);
  }

  /**
   * 删除用户
   * 前端请求：DELETE /api/v1/users/delete/1001
   */
  @Delete('delete/:id?') //注意这里的问号代表id是可选
  // 如果一定要设置默认值必须在路径参数里加问号，否则会报错，然后通过id: string = '1'设置默认值
  deleteUser(@Param('id') id: string) {
    // console.log(`--- 收到删除用户请求，目标ID: ${id} ---`);
    // 手动检查，如果没传，抛出 400 错误
    if (!id) {
      throw new BadRequestException(
        '必须传入要删除的用户 ID，禁止无差别删除！',
      );
    }
    return this.appService.deleteUser(id);
  }

  // 前端传递id拖拽排序
  @Post('list/drag')
  async handlerDragList(@Body() body: any): Promise<any> {
    return await this.appService.handlerDragList(body.newList); // 调用了你 Service 里的插入方法往数据库增加一条数据
  }

  // @SkipThrottle() 跳过限流，让定时唤醒工具和 Render 健康检查畅通无阻
  @Get('health')
  @SkipThrottle()
  healthCheck() {
    return { status: 'ok', time: new Date().toISOString() };
  }
}
