import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.contact.create({
      data,
    });
  }

  async findAllByProcess(processId: number) {
    return this.prisma.contact.findMany({
      where: { processId },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.contact.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.contact.delete({
      where: { id },
    });
  }
}
