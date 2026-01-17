import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProcessesService } from '../../services/processes.service';

@Component({
    selector: 'app-decision-board',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './decision-board.component.html',
    styleUrl: './decision-board.component.css'
})
export class DecisionBoardComponent implements OnInit {
    processes: any[] = [];
    rankedProcesses: any[] = [];

    constructor(private processesService: ProcessesService) { }

    ngOnInit() {
        this.processesService.getAll().subscribe(processes => {
            this.processes = processes;
            this.calculateRankings();
        });
    }

    calculateRankings() {
        this.rankedProcesses = this.processes
            .map(p => ({
                ...p,
                careerFitScore: this.calculateFitScore(p)
            }))
            .filter(p => p.careerFitScore > 0)
            .sort((a, b) => b.careerFitScore - a.careerFitScore);
    }

    calculateFitScore(process: any): number {
        const tech = process.scoreTech || 0;
        const wlb = process.scoreWLB || 0;
        const growth = process.scoreGrowth || 0;
        const vibe = process.scoreVibe || 0;

        const total = tech + wlb + growth + vibe;
        return total > 0 ? Math.round((total / 40) * 100) : 0;
    }

    getScoreClass(score: number): string {
        if (score >= 80) return 'score-excellent';
        if (score >= 60) return 'score-good';
        if (score >= 40) return 'score-fair';
        return 'score-poor';
    }
}
