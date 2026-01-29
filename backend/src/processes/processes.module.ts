import { Module } from '@nestjs/common';
import { ProcessesService } from './processes.service';
import { ProcessesController } from './processes.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Process } from './process.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Process])],
  controllers: [ProcessesController],
  providers: [ProcessesService],
})
export class ProcessesModule {}
