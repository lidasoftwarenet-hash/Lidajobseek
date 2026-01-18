import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReviewDto) {
    return this.prisma.selfReview.create({
      data: dto,
    });
  }

  async findByProcess(processId: number) {
    return this.prisma.selfReview.findMany({
      where: { processId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.selfReview.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.selfReview.delete({
      where: { id },
    });
  }
}
