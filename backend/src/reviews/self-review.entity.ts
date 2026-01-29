import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Process } from '../processes/process.entity';

@Entity({ schema: 'app' })
export class SelfReview {
  @PrimaryKey()
  id!: number;

  @Property()
  stage!: string;

  @Property()
  confidence!: number;

  @Property()
  whatWentWell!: string;

  @Property()
  whatFailed!: string;

  @Property()
  gaps!: string;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @ManyToOne(() => Process)
  process!: Process;
}