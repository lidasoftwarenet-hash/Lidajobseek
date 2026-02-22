import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersSettingsService } from './users-settings.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from './user.entity';
import { UserSettings } from './user-settings.entity';
import { UserProcessStages } from './user-process-stages.entity';

@Module({
    imports: [MikroOrmModule.forFeature([User, UserSettings, UserProcessStages])],
    providers: [UsersService, UsersSettingsService],
    exports: [UsersService, UsersSettingsService],
})
export class UsersModule { }
