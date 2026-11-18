import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class UserService {
  constructor(private dataSource: DataSource) {}

  // 抽离出来的建表方法，只专注干一件事
  private async initCustomerTable(queryRunner: QueryRunner) {
    await queryRunner.query(`
      CREATE TABLE customer (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        account VARCHAR(100) NOT NULL,
        user_id INT NOT NULL,
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        login_time DATETIME
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    // 插入初始化数据
    await queryRunner.query(`
      INSERT INTO customer (name, account, user_id, create_time, login_time)
      VALUES ('虚拟客户', 'account_001', 999, NOW(), NOW());
    `);
  }
  // 前端点击按钮请求在数据库建一个表
  async createSchema(): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // 1. 安检：判断 customer 表是否已经存在
      const tableExists = await queryRunner.hasTable('customer');

      if (tableExists) {
        // 如果存在，直接抛出 409 错误，前端会收到明确提示
        throw new ConflictException('customer 表已存在，请勿重复创建！');
      }

      // 2. 表不存在，开启事务，准备建表
      await queryRunner.startTransaction();

      // 3. 执行建表 SQL（因为前面已经判断过不存在了，这里就不需要 IF NOT EXISTS 了）
      await this.initCustomerTable(queryRunner);

      // 4. 提交事务
      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'customer 表创建成功，且初始化数据已写入！',
      };
    } catch (err: any) {
      // 6. 防呆处理：如果事务已经开启且发生未知错误，执行回滚
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      // 7. 如果是我们自己抛出的 409 冲突错误，直接原样抛给前端
      if (err instanceof ConflictException) {
        throw err;
      }

      // 8. 如果是其他未知的数据库错误（比如 SQL 语法写错了），包装成 500 错误抛出
      throw new InternalServerErrorException(`创建表失败: ${err.message}`);
    } finally {
      // 9. 必须释放数据库连接
      await queryRunner.release();
    }
  }

  // 前端点击按钮请求在数据库删除一个表
  async deleteSchema(): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      // 1. 安检：判断 customer 表是否存在
      const tableExists = await queryRunner.hasTable('customer');
      if (!tableExists) {
        // 如果不存在，直接抛出 404 错误，前端会收到明确提示
        throw new ConflictException('customer 表不存在，无法删除！');
      }

      // 2. 表存在，开启事务，准备删除表
      await queryRunner.startTransaction();
      await queryRunner.query('DROP TABLE customer');
      await queryRunner.commitTransaction();
      return {
        success: true,
        message: 'customer 表删除成功！',
      };
    } catch (err: any) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw new InternalServerErrorException(`删除表失败: ${err.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  // 前端点击按钮创建一条用户数据进入customer表
  async createCustomer(body: any): Promise<any> {
    const { name, account, user_id } = body;
    if (!name || !account || !user_id) {
      throw new BadRequestException('缺少必填字段');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction(); // 开启事务，保证建表和插数据同生共死

    try {
      // 1. 检查表是否存在
      const tableExists = await queryRunner.hasTable('customer');

      // 2. 不存在？那就地建表（把建表逻辑抽成独立方法，代码不拥挤）
      if (!tableExists) {
        await this.initCustomerTable(queryRunner);
      }

      // 如果表里已经有同名的客户，直接抛出 409 错误，前端会收到明确提示
      const existingCustomer = await queryRunner.query(
        'SELECT * FROM customer WHERE name = ?',
        [name],
      );
      if (existingCustomer.length > 0) {
        throw new ConflictException(`客户${name}已存在，无法重复创建！`);
      }
      // 3. 建完表（或者表本来就存在），直接顺流而下，执行插入！
      const createTime =
        body.create_time ||
        new Date().toISOString().slice(0, 19).replace('T', ' ');
      const loginTime = body.login_time || null;

      const insertSql = `
        INSERT INTO customer (name, account, user_id, create_time, login_time) 
        VALUES (?, ?, ?, ?, ?)
      `;

      const result = await queryRunner.query(insertSql, [
        name,
        account,
        user_id,
        createTime,
        loginTime,
      ]);

      // 4. 插入成功，提交事务
      await queryRunner.commitTransaction();

      return {
        success: true,
        message: tableExists
          ? '数据已追加至现有表'
          : '新表创建成功，并已存入数据',
        insertId: result.insertId,
      };
    } catch (err: any) {
      // 如果中途报错（比如插入字段超长），回滚事务（连刚刚建的表也会撤销）
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(`操作失败: ${err.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  // 前端点击按钮获取customer表的所有数据
  async listCustomer(): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      // 1. 检查表是否存在
      const tableExists = await queryRunner.hasTable('customer');
      if (!tableExists) {
        throw new ConflictException('customer 表不存在，无法查询！');
      }
      // 2. 表存在，执行查询
      const customers = await queryRunner.query('SELECT * FROM customer');
      return { success: true, list: customers };
    } catch (err: any) {
      throw new InternalServerErrorException(`查询失败: ${err.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  // 联表查询数据返回给前端
  async joinTableQuery(body: any): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      // 1. 检查表是否存在
      const customerTableExists = await queryRunner.hasTable('customer');
      const userTableExists = await queryRunner.hasTable('users');
      if (!customerTableExists || !userTableExists) {
        throw new ConflictException(
          'customer 或 user 表不存在，无法进行联表查询！',
        );
      }
      // 2. 表存在，执行联表查询
      const joinQuery = `
        SELECT 
        c.id, c.name AS customerName, c.account,
        u.name AS userName, u.email AS userEmail
        FROM customer c
        INNER JOIN users u ON c.user_id = u.id
        WHERE u.id = ${body.user_id}
      `;
      //  WHERE u.id = ${body.user_id}这里的user_id是前端传过来的参数，表示要查询的用户ID
      const result = await queryRunner.query(joinQuery);
      return { success: true, list: result };
    } catch (err: any) {
      throw new InternalServerErrorException(`联表查询失败: ${err.message}`);
    } finally {
      await queryRunner.release();
    }
  }
}
