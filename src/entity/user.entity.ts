// src/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users') // 指定表名为 users
export class User {
  @PrimaryGeneratedColumn() // 自动生成的主键 id
  id: number;

  @Column({ length: 100, unique: true }) // 长度为 100 的字符串 唯一且可为空
  name: string;

  @Column('int') // 整数
  age: number;

  @Column('varchar', { length: 10 }) // 字符串
  sex: string;

  @Column({ nullable: true }) // 字符串
  email: string;

  @Column('int')
  sort_id: number;
}
