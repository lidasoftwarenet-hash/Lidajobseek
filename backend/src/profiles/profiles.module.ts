import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Profile } from './profile.entity';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { DeepSeekService } from '../ai/deepseek.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MikroOrmModule.forFeature([Profile, User]), UsersModule, MailModule],
  controllers: [ProfilesController],
  providers: [ProfilesService, DeepSeekService],
})
export class ProfilesModule {}