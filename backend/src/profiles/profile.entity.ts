import { Entity, PrimaryKey, Property, OneToOne } from '@mikro-orm/core';
import { User } from '../users/user.entity';

@Entity({ schema: 'app' })
export class Profile {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true, length: 255 })
  fullName?: string;

  @Property({ nullable: true, length: 120 })
  firstName?: string;

  @Property({ nullable: true, length: 500 })
  address?: string;

  @Property({ nullable: true, length: 120 })
  idNumber?: string;

  @Property({ nullable: true, length: 4000 })
  about?: string;

  @Property({ nullable: true, length: 2000 })
  topSkills?: string;

  @Property({ nullable: true, length: 3000 })
  activity?: string;

  @Property({ nullable: true, length: 4000 })
  oldCompanies?: string;

  @Property({ nullable: true, length: 4000 })
  experience?: string;

  @Property({ nullable: true, length: 4000 })
  privateProjects?: string;

  @Property({ nullable: true, length: 3000 })
  education?: string;

  @Property({ nullable: true, length: 3000 })
  certifications?: string;

  @Property({ nullable: true, length: 2000 })
  links?: string;

  @Property({ nullable: true, length: 500 })
  lastCvUrl?: string;

  @Property({ nullable: true })
  lastCvGeneratedAt?: Date;

  @Property({ nullable: true })
  lastCvAi?: boolean;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @OneToOne(() => User, user => user.profile, { owner: true })
  user!: User;
}