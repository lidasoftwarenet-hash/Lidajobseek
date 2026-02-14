import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { User } from '../users/user.entity';
import { Folder } from './folder.entity';

@Entity({ schema: 'app' })
export class Resource {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property()
  type!: string;

  @Property()
  content!: string;

  @Property({ nullable: true })
  tags?: string;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => Folder, { nullable: true })
  folder?: Folder;
}
