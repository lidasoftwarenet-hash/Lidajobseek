import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProcessesService } from '../../services/processes.service';
import Chart from 'chart.js/auto';

@Component({
    selector: 'app-analytics',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './analytics.component.html',
    styleUrls: ['./analytics.component.css']
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

            const isDark = document.body.classList.contains('dark-theme');
            const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
            const textColor = isDark ? '#94a3b8' : '#64748b';

            this.chart = new Chart(this.interactionChart.nativeElement, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Interactions',
                        data: interactionCounts,
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointBackgroundColor: '#4f46e5',
                        pointHoverRadius: 8,
                        pointBorderColor: isDark ? '#1e293b' : '#ffffff',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                            titleColor: isDark ? '#f8fafc' : '#0f172a',
                            bodyColor: isDark ? '#cbd5e1' : '#475569',
                            borderColor: isDark ? '#334155' : '#e2e8f0',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                                label: (context) => ` ${context.parsed.y} Interactions`
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                font: { size: 11, family: "'Inter', sans-serif" },
                                color: textColor
                            },
                            grid: { color: gridColor }
                        },
                        x: {
                            grid: { display: false },
                            ticks: {
                                font: { size: 11, family: "'Inter', sans-serif" },
                                color: textColor
                            }
                        }
                    }
                }
            });
        }, 0);
    }
}
