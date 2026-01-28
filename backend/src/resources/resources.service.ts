import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) { }

  create(data: any, userId: number) {
    return this.prisma.resource.create({ data: { ...data, userId } });
  }

  findAll(userId: number) {
    return this.prisma.resource.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findOne(id: number, userId: number) {
    return this.prisma.resource.findFirst({
      where: { id, userId },
    });
  }

  update(id: number, data: any, userId: number) {
    return this.prisma.resource.updateMany({
      where: { id, userId },
      data,
    });
  }

  remove(id: number, userId: number) {
    return this.prisma.resource.deleteMany({
      where: { id, userId },
    });
  }
}
