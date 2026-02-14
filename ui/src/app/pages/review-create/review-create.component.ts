import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReviewsService } from '../../services/reviews.service';
import { HasUnsavedChanges } from '../../guards/unsaved-changes.guard';

@Component({
    selector: 'app-review-create',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './review-create.component.html'
})
export class ReviewCreateComponent implements OnInit, HasUnsavedChanges {
    @ViewChild('reviewForm') reviewForm!: NgForm;
    submitted = false;
    processId!: number;
    review: any = {
        stage: '',
        confidence: 3,
        whatWentWell: '',
        whatFailed: '',
        gaps: ''
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private reviewsService: ReviewsService
    ) { }

    ngOnInit() {
        this.processId = Number(this.route.snapshot.paramMap.get('id'));
    }

    hasUnsavedChanges(): boolean {
        return !this.submitted && (this.reviewForm?.dirty === true);
    }

    onSubmit() {
        const payload = {
            ...this.review,
            processId: this.processId
        };
        this.reviewsService.create(payload).subscribe(() => {
            this.submitted = true;
            this.router.navigate(['/process', this.processId]);
        });
    }
}
