import { Entity, PrimaryKey, Property, OneToMany, Collection } from '@mikro-orm/core';
import { Process } from '../processes/process.entity';
import { Resource } from '../resources/resource.entity';

@Entity({ schema: 'app' })
export class User {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  email!: string;

  @Property()
  password!: string;

  @Property({ nullable: true })
  name?: string;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @OneToMany(() => Process, process => process.user)
  processes = new Collection<Process>(this);

  @OneToMany(() => Resource, resource => resource.user)
  resources = new Collection<Resource>(this);
}