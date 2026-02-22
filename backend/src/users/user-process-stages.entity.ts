import { Entity, PrimaryKey, Property, OneToOne } from '@mikro-orm/core';
import { User } from './user.entity';

@Entity({ schema: 'app' })
export class UserProcessStages {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => User, { unique: true })
  user!: User;

  @Property({ type: 'json' })
  stages: string[] = [];

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
