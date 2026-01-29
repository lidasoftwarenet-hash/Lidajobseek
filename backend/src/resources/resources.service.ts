import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager, QueryOrder } from '@mikro-orm/postgresql';
import { Resource } from './resource.entity';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: EntityRepository<Resource>,
    private readonly em: EntityManager,
  ) { }

  async create(data: any, userId: number): Promise<Resource> {
    const resource = this.resourceRepository.create({ ...data, userId });
    await this.em.persistAndFlush(resource);
    return resource;
  }

  async findAll(userId: number): Promise<Resource[]> {
    return this.resourceRepository.find(
      { userId },
      { orderBy: { updatedAt: QueryOrder.DESC } },
    );
  }

  async findOne(id: number, userId: number): Promise<Resource | null> {
    return this.resourceRepository.findOne({ id, userId });
  }

  async update(id: number, data: any, userId: number): Promise<Resource | null> {
    const resource = await this.resourceRepository.findOne({ id, userId });
    if (!resource) {
      return null;
    }
    Object.assign(resource, data);
    await this.em.flush();
    return resource;
  }

  async remove(id: number, userId: number): Promise<Resource | null> {
    const resource = await this.resourceRepository.findOne({ id, userId });
    if (resource) {
      await this.em.removeAndFlush(resource);
    }
    return resource;
  }
}
