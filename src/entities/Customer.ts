import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('customer', { schema: 'nest_demo' })
export class Customer {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('varchar', {
    name: 'name',
    nullable: true,
    comment: '用户姓名',
    length: 32,
  })
  name: string | null;

  @Column('int', { name: 'user_id', nullable: true, default: () => "'1'" })
  userId: number | null;

  @Column('decimal', {
    name: 'balance',
    nullable: true,
    precision: 10,
    scale: 2,
    default: () => "'0.00'",
  })
  balance: string | null;

  @Column('int', { name: 'order_quantity', default: () => "'0'" })
  orderQuantity: number;

  @Column('int', { name: 'version', default: () => "'1'" })
  version: number;

  @Column('varchar', { name: 'account', nullable: true, length: 100 })
  account: string | null;

  @Column('datetime', {
    name: 'create_time',
    nullable: true,
    comment: '记录创建时间',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createTime: Date | null;

  @Column('datetime', {
    name: 'login_time',
    nullable: true,
    comment: '记录登录时间',
    default: () => 'CURRENT_TIMESTAMP',
  })
  loginTime: Date | null;
}
