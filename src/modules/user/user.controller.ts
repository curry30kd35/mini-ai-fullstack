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
import { UserService } from './user.service';

@Controller('api/v3/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  //前端点击按钮请求在数据库建一个表
  @Post('create/schema') // 访问路径为 /api/v3/users/create/schema
  async createSchema(): Promise<any> {
    return await this.userService.createSchema();
  }

  // 前端点击按钮请求在数据库删除一个表
  @Delete('delete/schema') // 访问路径为 /api/v3/users/delete/schema
  async deleteSchema(): Promise<any> {
    return await this.userService.deleteSchema();
  }

  // 前端点击按钮创建一条用户数据进入customer表
  @Post('create/customer') // 访问路径为 /api/v3/users/create/customer
  async createCustomer(@Body() body: any): Promise<any> {
    return await this.userService.createCustomer(body);
  }

  // 前端点击按钮获取customer表的所有数据
  @Get('customer/list') // 访问路径为 /api/v3/users/customer/list
  async listCustomer(): Promise<any> {
    return await this.userService.listCustomer();
  }

  // 联表查询数据返回给前端
  @Post('join/query') // 访问路径为 /api/v3/users/join/query
  async joinTableQuery(@Body() body: any): Promise<any> {
    return await this.userService.joinTableQuery(body);
  }
}
