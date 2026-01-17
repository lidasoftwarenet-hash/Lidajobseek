import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProcessesService } from '../../services/processes.service';
import Chart from 'chart.js/auto';

@Component({
    selector: 'app-analytics',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './analytics.component.html'
})
export class AnalyticsComponent implements OnInit {
    @ViewChild('interactionChart') interactionChart!: ElementRef;

    stats: any = {
        total: 0,
        active: 0,
        funnel: [],
        rejectionRate: 0,
        averageInteractions: 0
    };

    daysRange = 14;
    private chart: any;
    private rawProcesses: any[] = [];

    constructor(private processesService: ProcessesService) { }

    ngOnInit() {
        this.processesService.getAll().subscribe(processes => {
            this.rawProcesses = processes;
            this.calculateStats(processes);
            this.generateChart();
        });
    }

    onRangeChange() {
        this.generateChart();
    }

    calculateStats(processes: any[]) {
        const total = processes.length;
        if (total === 0) return;

        this.stats.total = total;
        this.stats.active = processes.filter(p => p.currentStage !== 'Rejected' && p.currentStage !== 'Withdrawn' && p.currentStage !== 'Offer' && p.currentStage !== 'Signed').length;

        const stages = ['Applied', 'Phone Screen', 'Technical Interview', 'Final Interview', 'Offer'];
        this.stats.funnel = stages.map(stage => {
            const stageIndex = stages.indexOf(stage);
            const count = processes.filter(p => {
                const currentStageIndex = stages.indexOf(p.currentStage);
                return currentStageIndex >= stageIndex || (p.currentStage === 'Rejected' && stageIndex === 0);
            }).length;

            return { label: stage, count, percentage: Math.round((count / total) * 100) };
        });

        this.stats.rejectionRate = Math.round((processes.filter(p => p.currentStage === 'Rejected').length / total) * 100);

        const totalInteractions = processes.reduce((acc, p) => acc + (p._count?.interactions || 0), 0);
        this.stats.averageInteractions = (totalInteractions / total).toFixed(1);
    }

    generateChart() {
        const allInteractions: any[] = [];
        this.rawProcesses.forEach(p => {
            if (p.interactions) allInteractions.push(...p.interactions);
        });

        const labels: string[] = [];
        const interactionCounts: number[] = [];

        for (let i = this.daysRange - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateString = d.toISOString().split('T')[0];

            const count = allInteractions.filter(inter => {
                const interDate = new Date(inter.date).toISOString().split('T')[0];
                return interDate === dateString;
            }).length;

            // Format as dd/mm
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            labels.push(`${day}/${month}`);
            interactionCounts.push(count);
        }

        setTimeout(() => {
            if (this.chart) this.chart.destroy();

            this.chart = new Chart(this.interactionChart.nativeElement, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Interactions',
                        data: interactionCounts,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointBackgroundColor: '#2563eb',
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) => ` ${context.parsed.y} Interactions`
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1, font: { size: 11 } },
                            grid: { color: '#f3f4f6' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 11 } }
                        }
                    }
                }
            });
        }, 0);
    }
}
