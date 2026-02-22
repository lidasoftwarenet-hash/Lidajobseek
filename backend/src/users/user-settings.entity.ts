import { Entity, PrimaryKey, Property, OneToOne } from '@mikro-orm/core';
import { User } from './user.entity';

@Entity({ schema: 'app' })
export class UserSettings {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => User, { unique: true })
  user!: User;

  @Property({ nullable: true, default: 'light' })
  themePreference?: 'light' | 'dark' | 'auto';

  @Property({ nullable: true, default: 14 })
  fontSizePreference?: number;

  @Property({ nullable: true, default: '' })
  countryPreference?: string;

  @Property({ nullable: true, default: 'DD/MM/YYYY' })
  dateFormatPreference?:
    | 'MM/DD/YYYY'
    | 'DD/MM/YYYY'
    | 'YYYY-MM-DD'
    | 'YYYY/MM/DD'
    | 'DD-MM-YYYY'
    | 'MM-DD-YYYY'
    | 'DD.MM.YYYY'
    | 'MM.DD.YYYY'
    | 'YYYY.MM.DD';

  @Property({ nullable: true, default: '24' })
  timeFormatPreference?: '12' | '24';

  @Property({ nullable: true, default: 'USD' })
  salaryCurrencyPreference?: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'AUD' | 'CAD' | 'CHF' | 'HKD' | 'SGD' | 'INR' | 'RUB' | 'ILS' | 'RON';

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
