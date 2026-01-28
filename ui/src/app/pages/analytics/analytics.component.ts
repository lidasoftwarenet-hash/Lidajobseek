import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
export class AnalyticsComponent implements OnInit, AfterViewInit {
    @ViewChild('interactionChart') interactionChartRef!: ElementRef;
    @ViewChild('statusChart') statusChartRef!: ElementRef;
    @ViewChild('sourceChart') sourceChartRef!: ElementRef;
    @ViewChild('timelineChart') timelineChartRef!: ElementRef;

    stats: any = {
        total: 0,
        active: 0,
        offers: 0,
        interviewRate: 0,
        rejectionRate: 0,
        avgDaysInProcess: 0
    };

    daysRange = 30; // Default to 30 days for trend
    private charts: { [key: string]: any } = {};
    private rawProcesses: any[] = [];

    constructor(private processesService: ProcessesService) { }

    ngOnInit() {
        // Data fetching happens in AfterViewInit to ensure canvas elements are ready 
        // but we can fetch data here
        this.processesService.getAll().subscribe(processes => {
            this.rawProcesses = processes;
            this.calculateStats();
            this.initCharts();
        });
    }

    ngAfterViewInit() {
        // Chart initialization handled in subscription callback
    }

    onRangeChange() {
        this.updateTrendChart();
    }

    calculateStats() {
        const total = this.rawProcesses.length;
        if (total === 0) return;

        const p = this.rawProcesses;

        this.stats.total = total;
        this.stats.active = p.filter(x => ['Initial Call Scheduled', 'Interview Scheduled', 'Home Task Assigned', 'Final HR Interview Scheduled'].includes(x.currentStage)).length;
        this.stats.offers = p.filter(x => x.currentStage === 'Offer' || x.currentStage === 'Signed').length;

        // Calculate Interview Rate (Processes that passed initial stage)
        const interviewed = p.filter(x => x.currentStage !== 'Applied' && x.currentStage !== 'No Response (14+ Days)').length;
        this.stats.interviewRate = Math.round((interviewed / total) * 100);

        this.stats.rejectionRate = Math.round((p.filter(x => x.currentStage === 'Rejected').length / total) * 100);

        // Avg days active (simple approx for now)
        const completed = p.filter(x => ['Rejected', 'Offer', 'Signed', 'Withdrawn'].includes(x.currentStage));
        if (completed.length > 0) {
            const totalDays = completed.reduce((acc, curr) => {
                const start = new Date(curr.createdAt);
                const end = new Date(curr.updatedAt);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return acc + diffDays;
            }, 0);
            this.stats.avgDaysInProcess = Math.round(totalDays / completed.length);
        }
    }

    initCharts() {
        if (!this.interactionChartRef) return; // Guard clause

        this.createStatusChart();
        this.createSourceChart();
        this.createTimelineChart(); // Applications over time
        this.updateTrendChart(); // Interaction activity
    }

    createStatusChart() {
        const counts: { [key: string]: number } = {};
        this.rawProcesses.forEach(p => {
            counts[p.currentStage] = (counts[p.currentStage] || 0) + 1;
        });

        const labels = Object.keys(counts);
        const data = Object.values(counts);

        this.charts['status'] = new Chart(this.statusChartRef.nativeElement, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#4f46e5', '#ec4899', '#10b981', '#f59e0b', '#6366f1', '#84cc16', '#ef4444', '#64748b'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right', labels: { font: { size: 11 }, usePointStyle: true } }
                },
                cutout: '75%'
            }
        });
    }

    createSourceChart() {
        const counts: { [key: string]: number } = {};
        this.rawProcesses.forEach(p => {
            const source = p.source || 'Unknown';
            counts[source] = (counts[source] || 0) + 1;
        });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5); // Top 5

        this.charts['source'] = new Chart(this.sourceChartRef.nativeElement, {
            type: 'bar',
            data: {
                labels: sorted.map(x => x[0]),
                datasets: [{
                    label: 'Applications',
                    data: sorted.map(x => x[1]),
                    backgroundColor: 'rgba(79, 70, 229, 0.7)',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { display: false } }
                }
            }
        });
    }

    createTimelineChart() {
        // Group by Month (last 6 months)
        const months: string[] = [];
        const data: number[] = [];
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthLabel = d.toLocaleString('default', { month: 'short' });
            months.push(monthLabel);

            const count = this.rawProcesses.filter(p => {
                const pDate = new Date(p.createdAt);
                return pDate.getMonth() === d.getMonth() && pDate.getFullYear() === d.getFullYear();
            }).length;
            data.push(count);
        }

        this.charts['timeline'] = new Chart(this.timelineChartRef.nativeElement, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'New Applications',
                    data: data,
                    backgroundColor: '#10b981',
                    borderRadius: 4,
                    barThickness: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    updateTrendChart() {
        if (this.charts['trend']) this.charts['trend'].destroy();

        const allInteractions: any[] = [];
        this.rawProcesses.forEach(p => {
            if (p.interactions) allInteractions.push(...p.interactions);
        });

        const labels: string[] = [];
        const counts: number[] = [];

        for (let i = this.daysRange - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateString = d.toISOString().split('T')[0];

            const count = allInteractions.filter(inter => {
                const interDate = new Date(inter.date).toISOString().split('T')[0];
                return interDate === dateString;
            }).length;

            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            labels.push(`${day}/${month}`);
            counts.push(count);
        }

        this.charts['trend'] = new Chart(this.interactionChartRef.nativeElement, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Activity',
                    data: counts,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } }
                },
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
            }
        });
    }
}
