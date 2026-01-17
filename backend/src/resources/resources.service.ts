import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ResourcesService {
    constructor(private prisma: PrismaService) { }

    create(data: any) {
        return this.prisma.resource.create({ data });
    }

    findAll() {
        return this.prisma.resource.findMany({
            orderBy: { updatedAt: 'desc' }
        });
    }

    findOne(id: number) {
        return this.prisma.resource.findUnique({
            where: { id }
        });
    }

    update(id: number, data: any) {
        return this.prisma.resource.update({
            where: { id },
            data
        });
    }

    remove(id: number) {
        return this.prisma.resource.delete({
            where: { id }
        });
    }
}
