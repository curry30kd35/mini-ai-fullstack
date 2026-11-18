import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('IDX_51b8b26ac168fbe7d6f5653e6c', ['name'], { unique: true })
@Entity('users', { schema: 'nest_demo' })
export class Users {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('varchar', { name: 'name', unique: true, length: 100 })
  name: string;

  @Column('varchar', { name: 'sex', length: 10 })
  sex: string;

  @Column('int', { name: 'age' })
  age: number;

  @Column('varchar', { name: 'email', nullable: true, length: 255 })
  email: string | null;

  @Column('int', { name: 'sort_id' })
  sortId: number;
}
