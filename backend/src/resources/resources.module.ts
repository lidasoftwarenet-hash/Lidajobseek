import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Resource } from './resource.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Resource])],
  controllers: [ResourcesController],
  providers: [ResourcesService],
})
export class ResourcesModule {}
