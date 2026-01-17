import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    create(dto: CreateReviewDto): Promise<{
        createdAt: Date;
        id: number;
        processId: number;
        stage: string;
        confidence: number;
        whatWentWell: string;
        whatFailed: string;
        gaps: string;
    }>;
    update(id: number, dto: any): Promise<{
        createdAt: Date;
        id: number;
        processId: number;
        stage: string;
        confidence: number;
        whatWentWell: string;
        whatFailed: string;
        gaps: string;
    }>;
    remove(id: number): Promise<{
        createdAt: Date;
        id: number;
        processId: number;
        stage: string;
        confidence: number;
        whatWentWell: string;
        whatFailed: string;
        gaps: string;
    }>;
}
