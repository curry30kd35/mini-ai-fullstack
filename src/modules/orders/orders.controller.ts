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
import { OrdersService } from './orders.service';

@Controller('api/v3/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  //前端点击按钮请求下一个订单然后更新customer用户数据---悲观锁案例
  @Post('create/order') // 访问路径为 /api/v3/users/create/schema
  async createOrder(@Body() body: any): Promise<any> {
    return await this.ordersService.createOrder(body);
  }

  // 乐观锁案例，修改余额------乐观锁案例
  @Post('modify/balance') // 访问路径为 /api/v3/users/modify/balance
  async modifyBalance(@Body() body: any): Promise<any> {
    return await this.ordersService.modifyBalance(body);
  }

  // 查询余额
  @Get('check/balance') // 访问路径为 /api/v3/users/check/balance
  async checkBalance(@Query('user_id') user_id: string): Promise<any> {
    return await this.ordersService.checkBalance(user_id);
  }

  // 查询总消费总数量排行
  // @Get('check/rank') // 访问路径为 /api/v3/users/check/rank
  // async checkRank(): Promise<any> {
  //   return await this.ordersService.checkRank();
  // }

  // 模拟 Redis 分布式锁和 Lua脚本防止操作人数过多导致数据库被占满
  @Post('modify/redis') // 访问路径为 /api/v3/orders/balance/redis
  async modifyRedis(@Body() body: any): Promise<any> {
    return await this.ordersService.modifyRedis(body);
  }
}
