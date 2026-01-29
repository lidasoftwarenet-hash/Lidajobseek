import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager, QueryOrder } from '@mikro-orm/postgresql';
import { SelfReview } from './self-review.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(SelfReview)
    private readonly reviewRepository: EntityRepository<SelfReview>,
    private readonly em: EntityManager,
  ) {}

  async create(dto: CreateReviewDto): Promise<SelfReview> {
    const review = this.reviewRepository.create(dto as any);
    await this.em.persistAndFlush(review);
    return review;
  }

  async findByProcess(processId: number): Promise<SelfReview[]> {
    return this.reviewRepository.find(
      { process: processId },
      { orderBy: { createdAt: QueryOrder.DESC } },
    );
  }

  async update(id: number, data: any): Promise<SelfReview | null> {
    const review = await this.reviewRepository.findOne({ id });
    if (!review) {
      return null;
    }
    Object.assign(review, data);
    await this.em.flush();
    return review;
  }

  async remove(id: number): Promise<SelfReview | null> {
    const review = await this.reviewRepository.findOne({ id });
    if (review) {
      await this.em.removeAndFlush(review);
    }
    return review;
  }
}
