import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReviewsService } from '../../services/reviews.service';
import { ResourcesService } from '../../services/resources.service';
import { ProcessesService } from '../../services/processes.service';
import { InteractionsService } from '../../services/interactions.service';

interface Stats {
  activeProcesses: number;
  completedReviews: number;
  totalResources: number;
  upcomingInteractions: number;
  resourcesRead: number;
}

interface Tip {
  icon: string;
  title: string;
  text: string;
}

@Component({
  selector: 'app-coach-hub',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './coach-hub.component.html',
  styleUrls: ['./coach-hub.component.css']
})
export class CoachHubComponent implements OnInit {
  stats: Stats = {
    activeProcesses: 0,
    completedReviews: 0,
    totalResources: 0,
    upcomingInteractions: 0,
    resourcesRead: 0
  };

  reviews: any[] = [];
  resources: any[] = [];
  currentTipIndex = 0;

  tips: Tip[] = [
    {
      icon: '🎯',
      title: 'Set Clear Goals',
      text: 'Define what success looks like for you. Whether it\'s landing interviews, improving skills, or building networks - clarity drives action.'
    },
    {
      icon: '📝',
      title: 'Track Everything',
      text: 'Document your applications, interviews, and learnings. Patterns emerge from data, helping you refine your approach and celebrate progress.'
    },
    {
      icon: '🔄',
      title: 'Iterate & Improve',
      text: 'Every application is a learning opportunity. Use self-reviews to identify what works, adjust your strategy, and continuously grow.'
    },
    {
      icon: '💪',
      title: 'Stay Consistent',
      text: 'Job searching is a marathon, not a sprint. Small, consistent actions compound over time. Show up daily, even when it\'s hard.'
    },
    {
      icon: '🌟',
      title: 'Celebrate Wins',
      text: 'Acknowledge every milestone - a great interview, positive feedback, or skills learned. Progress deserves recognition!'
    },
    {
      icon: '🤝',
      title: 'Build Relationships',
      text: 'Your network is your net worth. Connect authentically, offer value first, and nurture professional relationships.'
    },
    {
      icon: '📚',
      title: 'Never Stop Learning',
      text: 'Invest in yourself. Take courses, read articles, practice skills. Continuous learning keeps you competitive and confident.'
    },
    {
      icon: '🧘',
      title: 'Practice Self-Care',
      text: 'Job searching can be stressful. Maintain balance, take breaks, and prioritize your mental health. You perform best when you feel your best.'
    }
  ];

  constructor(
    private reviewsService: ReviewsService,
    private resourcesService: ResourcesService,
    private processesService: ProcessesService,
    private interactionsService: InteractionsService
  ) {}

  ngOnInit() {
    this.loadData();
    this.startTipRotation();
  }

  async loadData() {
    try {
      // Load all data in parallel
      const [processes, reviews, resources, interactions] = await Promise.all([
        this.processesService.getAll().toPromise(),
        this.reviewsService.getAll().toPromise(),
        this.resourcesService.getAll().toPromise(),
        this.interactionsService.getAll().toPromise()
      ]);

      // Calculate stats
      this.stats.activeProcesses = processes?.filter((p: any) =>
        p.status === 'Applied' || p.status === 'Interviewing' || p.status === 'In Progress'
      ).length || 0;

      this.stats.completedReviews = reviews?.length || 0;
      this.stats.totalResources = resources?.length || 0;

      // Count upcoming interactions (within next 7 days)
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      this.stats.upcomingInteractions = interactions?.filter((i: any) => {
        const interactionDate = new Date(i.date);
        return interactionDate >= now && interactionDate <= nextWeek;
      }).length || 0;

      // Simulate resources read (you can track this in localStorage or backend)
      this.stats.resourcesRead = this.getResourcesReadCount();

      // Store recent reviews
      this.reviews = reviews?.slice(0, 3) || [];

      // Store resources
      this.resources = resources || [];

    } catch (error) {
      console.error('Error loading coach hub data:', error);
    }
  }

  getResourcesReadCount(): number {
    const readResources = localStorage.getItem('resourcesRead');
    return readResources ? JSON.parse(readResources).length : 0;
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return d.toLocaleDateString('en-US', options);
  }

  getScoreClass(score: number): string {
    if (score >= 8) return 'score-high';
    if (score >= 5) return 'score-medium';
    return 'score-low';
  }

  getResourceIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'article': '📄',
      'video': '🎥',
      'tutorial': '🎓',
      'premium': '⭐',
      'book': '📚',
      'podcast': '🎙️',
      'course': '🎯'
    };
    return icons[type.toLowerCase()] || '📌';
  }

  // Tip carousel functionality
  nextTip() {
    if (this.currentTipIndex < this.tips.length - 1) {
      this.currentTipIndex++;
    }
  }

  previousTip() {
    if (this.currentTipIndex > 0) {
      this.currentTipIndex--;
    }
  }

  goToTip(index: number) {
    this.currentTipIndex = index;
  }

  startTipRotation() {
    // Auto-rotate tips every 8 seconds
    setInterval(() => {
      this.currentTipIndex = (this.currentTipIndex + 1) % this.tips.length;
    }, 8000);
  }

  openGuide() {
    // You can link to documentation or open a modal with guides
    window.open('https://docs.example.com/guide', '_blank');
  }

  contactSupport() {
    // Open support modal or email
    window.location.href = 'mailto:support@example.com?subject=Coach Hub Support';
  }
}
