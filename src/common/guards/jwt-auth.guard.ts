import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 继承自 Passport 的 AuthGuard，指定策略名称为 'jwt'
 * 使用时只需在 Controller 或具体方法上加：@UseGuards(JwtAuthGuard)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
