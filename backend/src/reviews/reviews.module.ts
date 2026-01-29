import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SelfReview } from './self-review.entity';

@Module({
  imports: [MikroOrmModule.forFeature([SelfReview])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
