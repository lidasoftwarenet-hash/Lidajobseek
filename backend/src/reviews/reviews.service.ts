import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager, QueryOrder } from '@mikro-orm/postgresql';
import { SelfReview } from './self-review.entity';
import { Process } from '../processes/process.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(SelfReview)
    private readonly reviewRepository: EntityRepository<SelfReview>,
    @InjectRepository(Process)
    private readonly processRepository: EntityRepository<Process>,
    private readonly em: EntityManager,
  ) {}

  async create(dto: CreateReviewDto, userId: number): Promise<SelfReview> {
    const process = await this.processRepository.findOne({ id: dto.processId, user: userId });
    if (!process) {
      throw new Error('Process not found');
    }
    const review = this.reviewRepository.create({
      ...dto,
      process,
    } as any);
    await this.em.persistAndFlush(review);
    return review;
  }

  async findByProcess(processId: number, userId: number): Promise<SelfReview[]> {
    return this.reviewRepository.find(
      { process: { id: processId, user: userId } },
      { orderBy: { createdAt: QueryOrder.DESC } },
    );
  }

  async update(id: number, data: any, userId: number): Promise<SelfReview | null> {
    const review = await this.reviewRepository.findOne({ id, process: { user: userId } });
    if (!review) {
      return null;
    }
    Object.assign(review, data);
    await this.em.flush();
    return review;
  }

  async remove(id: number, userId: number): Promise<SelfReview | null> {
    const review = await this.reviewRepository.findOne({ id, process: { user: userId } });
    if (review) {
      await this.em.removeAndFlush(review);
    }
    return review;
  }
}
