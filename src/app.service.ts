import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm'; //引入 Like 操作符
import { User } from './entity/user.entity';

@Injectable()
export class AppService {
  // 注入 UserRepository---模拟数据库操作
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  // 往数据库插入一条数据
  async createUser(createUserDto: any) {
    // const user = this.userRepository.create({
    //   name: createUserDto.name,
    //   sex: createUserDto.sex,
    //   age: createUserDto.age,
    //   email: createUserDto.email,
    // });
    // // 只在数据库中创建一条信息，不返回数据
    // await this.userRepository.save(user);
    try {
      const user = this.userRepository.create(createUserDto);
      return await this.userRepository.save(user);
    } catch (error: any) {
      // MySQL 报错代码 'ER_DUP_ENTRY' 代表唯一键冲突
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        throw new ConflictException('该用户数据已存在，添加失败！');
      }
      // 如果是其他未知错误，原样抛出
      throw error;
    }
  }

  // get请求
  getHello(id: string): string {
    return `这是第一条返回的消息，ID: ${id}`;
  }

  // get请求
  // getUserList(page: string, pageSize: string, keyword?: string): object {
  //   return {
  //     total: 100,
  //     page: Number(page),
  //     pageSize: Number(pageSize),
  //     list: [{ id: 1001, name: '张三', role: 'Frontend Engineer' }],
  //   };
  // }
  // 接收参数，并实现真实的分页与条件查询
  async getUserList(
    page: number = 1,
    pageSize: number = 10,
    keyword?: string,
  ): Promise<{ total: number; page: number; pageSize: number; list: User[] }> {
    // return await this.userRepository.find(); // 查询所有数据
    // 1. 构建查询条件
    let whereCondition = {};

    // 如果传了 keyword，就去匹配 name 字段（模糊查询）
    if (keyword) {
      // 模糊查询：使用 Like 操作符，% 代表任意字符，比如包含"张三"就能查到
      // whereCondition = {
      //   name: Like(`%${keyword}%`), // % 代表任意字符，比如包含"张三"就能查到
      // };

      // 精准匹配，直接写值就行，不需要 Like
      whereCondition = {
        name: keyword,
      };
    }

    // 2. 使用 findAndCount 同时查出数据和总数
    const [list, total] = await this.userRepository.findAndCount({
      where: whereCondition,
      // 分页公式：跳过前 (page - 1) * pageSize 条，取 pageSize 条
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { sort_id: 'ASC' }, // 按sort_id排序
    });

    // 3. 返回标准格式
    return {
      total,
      page,
      pageSize,
      list,
    };
  }

  // patch请求
  // 接收 Controller 传来的 id 和 updateData
  async updateUser(id: string, updateData: Record<string, any>): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: Number(id) },
    });
    if (!user) throw new NotFoundException('用户不存在');

    // 安全做法：不要直接用 updateData 覆盖，只取出允许修改的字段
    const { name, age, email, sex } = updateData;

    if (name !== undefined) user.name = name;
    if (age !== undefined) user.age = age;
    if (email !== undefined) user.email = email;
    if (sex !== undefined) user.sex = sex;

    return await this.userRepository.save(user);
  }

  // delete请求
  // 实现删除逻辑
  async deleteUser(id: string): Promise<object> {
    // 1. 先根据 id 查一下有没有这个人
    const user = await this.userRepository.findOne({
      where: { id: Number(id) },
    });

    // 2. 如果没找到，抛出 404 错误，前端就会看到提示
    if (!user) {
      throw new NotFoundException(`找不到 ID 为 ${id} 的用户，无法删除`);
    }

    // 3. 找到了，执行删除操作
    await this.userRepository.remove(user);

    // 4. 返回一个成功的提示给前端
    return {
      code: 200,
      message: `ID 为 ${id} 的用户已成功删除`,
    };
  }

  // 通过前端传的id更新排序
  async handlerDragList(ids: number[]): Promise<any> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new NotFoundException('参数错误，需传入 ID 数组');
    }
    try {
      // 极其简单：循环这个数组，把下标+1 赋给对应的 sort_id
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const newSortId = i + 1; // 第一个是1，第二个是2...

        await this.userRepository.update(id, { sort_id: newSortId });
      }

      return { code: 200, message: '排序更新成功' };
    } catch (error) {
      return { code: 500, message: '更新失败' };
    }
  }
}
