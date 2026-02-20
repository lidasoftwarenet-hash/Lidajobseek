import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { User } from './user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: EntityRepository<User>,
        private readonly em: EntityManager,
    ) { }

    async findOne(email: string): Promise<User | null> {
        return this.userRepository.findOne({ email });
    }

    async findById(id: number): Promise<User | null> {
        return this.userRepository.findOne({ id });
    }

    async findByActivationToken(token: string): Promise<User | null> {
        return this.userRepository.findOne({ activationToken: token });
    }

  async create(data: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    pricingPlan?: string;
    processStages?: string[];
    themePreference?: 'light' | 'dark' | 'auto';
    fontSizePreference?: number;
    countryPreference?: string;
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
    salaryCurrencyPreference?: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'AUD' | 'CAD' | 'CHF' | 'HKD' | 'SGD' | 'INR' | 'RUB' | 'ILS' | 'RON';
    isActive?: boolean;
    activationToken?: string | null;
    activationTokenExpiresAt?: Date | null;
  }): Promise<User> {
    const user = this.userRepository.create(data as any);
    await this.em.persistAndFlush(user);
    return user;
  }

  async save(user: User): Promise<User> {
    await this.em.persistAndFlush(user);
    return user;
  }
}
