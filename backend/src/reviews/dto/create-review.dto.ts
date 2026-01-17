export class CreateReviewDto {
    processId: number;
    stage: string;
    confidence: number; // 1–5
    whatWentWell: string;
    whatFailed: string;
    gaps: string;
}
