import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager, QueryOrder } from '@mikro-orm/postgresql';
import { Resource } from './resource.entity';
import { Folder } from './folder.entity';
import { User } from '../users/user.entity';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: EntityRepository<Resource>,
    @InjectRepository(Folder)
    private readonly folderRepository: EntityRepository<Folder>,
    private readonly em: EntityManager,
  ) { }

  async create(data: CreateResourceDto & { folderId?: number }, userId: number): Promise<Resource> {
    // Check user plan and resource count
    const user = await this.em.findOne(User, { id: userId });
    const isPremium = user?.pricingPlan === 'premium' || user?.pricingPlan === 'enterprise';

    if (!isPremium) {
      const count = await this.resourceRepository.count({ user: userId });
      if (count >= 5) {
        throw new BadRequestException('Free users are limited to 5 documents. Please upgrade for unlimited storage.');
      }
    }

    const resourceData: any = { ...data, user: userId };
    if (data.folderId) {
      const folder = await this.folderRepository.findOne({ id: data.folderId, user: userId });
      if (!folder) {
        throw new NotFoundException('Folder not found');
      }
      resourceData.folder = folder;
      delete resourceData.folderId;
    }
    const resource = this.resourceRepository.create(resourceData);
    await this.em.persistAndFlush(resource);
    return resource;
  }

  async findAll(userId: number, folderId?: number): Promise<any> {
    const query: any = { user: userId };

    if (folderId) {
      query.folder = folderId;
    } else if (folderId === undefined) {
      // If folderId is undefined, we return everything (or maybe just root? Let's return everything for now if no folderId specified)
      // Actually, for a nice file explorer, we usually want root if no ID.
    }

    const resources = await this.resourceRepository.find(
      query,
      { orderBy: { updatedAt: QueryOrder.DESC } },
    );

    return resources;
  }

  async getFolderTree(userId: number) {
    // Return all folders for the user to reconstruct tree on frontend or return structured
    const folders = await this.folderRepository.find({ user: userId }, { populate: ['parent'] });
    return folders;
  }

  async createFolder(name: string, userId: number, parentId?: number): Promise<Folder> {
    const data: any = { name, user: userId };
    if (parentId) {
      const parentFolder = await this.folderRepository.findOne({ id: parentId, user: userId });
      if (!parentFolder) {
        throw new NotFoundException('Folder not found');
      }
      data.parent = parentFolder;
    }
    const folder = this.folderRepository.create(data);
    await this.em.persistAndFlush(folder);
    return folder;
  }

  async updateFolder(id: number, name: string, userId: number): Promise<Folder> {
    const folder = await this.folderRepository.findOne({ id, user: userId });
    if (!folder) throw new NotFoundException('Folder not found');
    folder.name = name;
    await this.em.flush();
    return folder;
  }

  async removeFolder(id: number, userId: number): Promise<void> {
    const folder = await this.folderRepository.findOne({ id, user: userId }, { populate: ['children', 'resources'] });
    if (!folder) throw new NotFoundException('Folder not found');

    // Recursive delete or just move to root? Let's delete for now as it's cleaner.
    await this.em.removeAndFlush(folder);
  }

  async findOne(id: number, userId: number): Promise<Resource | null> {
    return this.resourceRepository.findOne({ id, user: userId } as any);
  }

  async update(id: number, data: UpdateResourceDto, userId: number): Promise<Resource | null> {
    const resource = await this.resourceRepository.findOne({ id, user: userId } as any);
    if (!resource) {
      return null;
    }

    const updateData: any = { ...data };
    if (Object.prototype.hasOwnProperty.call(updateData, 'folderId')) {
      const rawFolderId = updateData.folderId;

      if (rawFolderId === null || rawFolderId === undefined || rawFolderId === '') {
        updateData.folder = null;
        delete updateData.folderId;
      } else {
        const folderId = Number(rawFolderId);
        if (!Number.isFinite(folderId) || folderId <= 0) {
          throw new BadRequestException('Invalid folderId');
        }

        const folder = await this.folderRepository.findOne({ id: folderId, user: userId });
        if (!folder) {
          throw new NotFoundException('Folder not found');
        }

        updateData.folder = folder;
        delete updateData.folderId;
      }
    }

    Object.assign(resource, updateData);
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
