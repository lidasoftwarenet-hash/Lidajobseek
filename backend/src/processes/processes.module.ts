import { Module } from '@nestjs/common';
import { ProcessesService } from './processes.service';
import { ProcessesController } from './processes.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Process } from './process.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([Process, User]),
    UsersModule,
  ],
  controllers: [ProcessesController],
  providers: [ProcessesService],
})
export class ProcessesModule {}
