import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('idx_orders_user_id', ['userId'], {})
@Entity('orders', { schema: 'nest_demo' })
export class Orders {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: '主键ID' })
  id: number;

  @Column('varchar', { name: 'name', nullable: true, length: 50 })
  name: string | null;

  @Column('int', { name: 'user_id', nullable: true })
  userId: number | null;

  @Column('decimal', {
    name: 'amount',
    precision: 10,
    scale: 2,
    default: () => "'0.00'",
  })
  amount: string;

  @Column('decimal', {
    name: 'balance',
    nullable: true,
    precision: 10,
    scale: 2,
    default: () => "'0.00'",
  })
  balance: string | null;

  @Column('datetime', {
    name: 'order_time',
    nullable: true,
    comment: '下单时间',
  })
  orderTime: Date | null;

  @Column('datetime', { name: 'pay_time', nullable: true, comment: '支付时间' })
  payTime: Date | null;

  @Column('datetime', {
    name: 'delivery_time',
    nullable: true,
    comment: '发货时间',
  })
  deliveryTime: Date | null;

  @Column('varchar', {
    name: 'goods_name',
    nullable: true,
    comment: '商品名称',
    length: 100,
  })
  goodsName: string | null;
}
