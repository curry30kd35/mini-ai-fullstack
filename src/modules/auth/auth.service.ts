import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt'; // 假设你后面要用 JWT 做登录状态

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 用户注册：加盐哈希加密入库
   */
  async register(dto: RegisterDto) {
    // 1. 检查邮箱是否重复
    const exist = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exist) {
      throw new ConflictException('该邮箱已被注册，请直接登录！');
    }

    // 2. 核心：使用 bcrypt 进行加盐哈希（Cost factor 推荐设为 10）
    // 盐（Salt）会自动随机生成并混入哈希值中，即使两个用户密码完全一样，存入数据库的哈希串也绝对不同！
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    // 3. 密文存入数据库
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: 'USER',
        password: hashedPassword, // 秘钥
      },
      // 4. 关键安全规范：返回结果绝对不能包含 password 字段
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  //   用户登录验证密码是否正确
  /**
   * 2. 【今日核心】用户登录验证与签发 Token
   */
  async login(dto: LoginDto) {
    // 步骤 1：去数据库按邮箱查找用户（同时必须过滤未被软删除的用户）
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        isDeleted: false,
      },
    });

    // 安全准则：如果用户不存在，千万不要说“用户不存在”，统一提示“邮箱或密码错误”，防止黑客枚举撞库！
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误！');
    }

    // 步骤 2：比对明文密码与数据库里的 Bcrypt 密文哈希
    // bcrypt.compare 会自动提取密文中的盐（Salt），把明文加密后进行恒定时间哈希比对
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误！');
    }

    // 步骤 3：组装 JWT Payload（载荷）
    // 警告：Payload 只是 Base64 编码，任何人都能看懂，严禁存放密码等高敏信息！
    const payload = {
      sub: user.id, // sub 是 JWT 规范标准字段，代表主体唯一标识（Subject），这里放用户 ID
      email: user.email,
      role: user.role,
    };

    // 步骤 4：使用秘钥对 Payload 进行签名并生成 Token
    const accessToken = await this.jwtService.signAsync(payload);

    // 步骤 5：返回 Token 以及当前用户的非敏感基础信息
    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
