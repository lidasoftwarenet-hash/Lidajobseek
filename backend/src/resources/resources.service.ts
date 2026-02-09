import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager, QueryOrder } from '@mikro-orm/postgresql';
import { Resource } from './resource.entity';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: EntityRepository<Resource>,
    private readonly em: EntityManager,
  ) { }

  async create(data: CreateResourceDto, userId: number): Promise<Resource> {
    const resource = this.resourceRepository.create({ ...data, user: userId } as any);
    await this.em.persistAndFlush(resource);
    return resource;
  }

  async findAll(userId: number): Promise<Resource[]> {
    return this.resourceRepository.find(
      { user: userId } as any,
      { orderBy: { updatedAt: QueryOrder.DESC } },
    );
  }

  async findOne(id: number, userId: number): Promise<Resource | null> {
    return this.resourceRepository.findOne({ id, user: userId } as any);
  }

  async update(id: number, data: UpdateResourceDto, userId: number): Promise<Resource | null> {
    const resource = await this.resourceRepository.findOne({ id, user: userId } as any);
    if (!resource) {
      return null;
    }
    Object.assign(resource, data);
    await this.em.flush();
    return resource;
  }

  async remove(id: number, userId: number): Promise<Resource | null> {
    const resource = await this.resourceRepository.findOne({ id, user: userId } as any);
    if (resource) {
      await this.em.removeAndFlush(resource);
    }
    return resource;
  }
}
