import { PrismaService } from '../prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
export declare class ReviewsService {
    private prisma;
    constructor(prisma: PrismaService);
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
    findByProcess(processId: number): Promise<{
        createdAt: Date;
        id: number;
        processId: number;
        stage: string;
        confidence: number;
        whatWentWell: string;
        whatFailed: string;
        gaps: string;
    }[]>;
    update(id: number, data: any): Promise<{
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
