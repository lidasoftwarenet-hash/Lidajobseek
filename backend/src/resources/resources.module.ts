import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Resource } from './resource.entity';
import { Folder } from './folder.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Resource, Folder])],
  controllers: [ResourcesController],
  providers: [ResourcesService],
})
export class ResourcesModule { }
