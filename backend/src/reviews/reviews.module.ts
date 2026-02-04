import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SelfReview } from './self-review.entity';
import { Process } from '../processes/process.entity';

@Module({
  imports: [MikroOrmModule.forFeature([SelfReview, Process])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
