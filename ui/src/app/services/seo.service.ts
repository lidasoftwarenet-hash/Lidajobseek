import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
  noIndex?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SEOService {
  private baseUrl = 'https://lidajobseek.com';
  private defaultImage = `${this.baseUrl}/assets/og-image.png`;

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private router: Router
  ) {
    this.initializeRouteListener();
  }

  private initializeRouteListener() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // Scroll to top on route change
        window.scrollTo(0, 0);
      });
  }

  updateMetaTags(config: SEOConfig) {
    // Update title
    const fullTitle = config.title + ' | Lida Job Seek';
    this.titleService.setTitle(fullTitle);

    // Update basic meta tags
    this.metaService.updateTag({ name: 'description', content: config.description });

    if (config.keywords) {
      this.metaService.updateTag({ name: 'keywords', content: config.keywords });
    }

    // Robots tag
    if (config.noIndex) {
      this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      this.metaService.updateTag({ name: 'robots', content: 'index, follow' });
    }

    // Open Graph tags
    const ogTitle = config.ogTitle || config.title;
    const ogDescription = config.ogDescription || config.description;
    const ogImage = config.ogImage || this.defaultImage;
    const ogUrl = config.ogUrl || `${this.baseUrl}${this.router.url}`;

    this.metaService.updateTag({ property: 'og:title', content: ogTitle });
    this.metaService.updateTag({ property: 'og:description', content: ogDescription });
    this.metaService.updateTag({ property: 'og:image', content: ogImage });
    this.metaService.updateTag({ property: 'og:url', content: ogUrl });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });

    // Twitter Card tags
    const twitterTitle = config.twitterTitle || ogTitle;
    const twitterDescription = config.twitterDescription || ogDescription;
    const twitterImage = config.twitterImage || ogImage;

    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: twitterTitle });
    this.metaService.updateTag({ name: 'twitter:description', content: twitterDescription });
    this.metaService.updateTag({ name: 'twitter:image', content: twitterImage });

    // Canonical URL
    const canonical = config.canonical || ogUrl;
    this.updateCanonicalUrl(canonical);
  }

  private updateCanonicalUrl(url: string) {
    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');

    if (link) {
      link.setAttribute('href', url);
    } else {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      document.head.appendChild(link);
    }
  }

  // Predefined SEO configs for common pages
  getProcessListSEO(): SEOConfig {
    return {
      title: 'Job Applications Dashboard',
      description: 'Manage all your job applications in one place. Track application status, set reminders, and stay organized throughout your job search journey.',
      keywords: 'job applications, application tracker, job search dashboard, track applications, job hunt management',
      ogTitle: 'Track Your Job Applications | Lida Job Seek',
    };
  }

  getProcessDetailsSEO(companyName?: string): SEOConfig {
    const title = companyName
      ? `${companyName} - Job Application Details`
      : 'Job Application Details';

    return {
      title,
      description: `View and manage your job application details. Track interactions, schedule interviews, and monitor your application progress.`,
      keywords: 'job application details, track application, interview tracking, application management',
    };
  }

  getCalendarSEO(): SEOConfig {
    return {
      title: 'Interview Calendar',
      description: 'Schedule and manage your job interviews with our integrated calendar. Never miss an interview and stay on top of your job search schedule.',
      keywords: 'interview calendar, interview scheduler, job interview planning, interview management, schedule interviews',
      ogTitle: 'Interview Calendar & Scheduler | Lida Job Seek',
    };
  }

  getAnalyticsSEO(): SEOConfig {
    return {
      title: 'Job Search Analytics',
      description: 'Get insights into your job search performance. Track application success rates, response times, and optimize your job hunting strategy.',
      keywords: 'job search analytics, application statistics, job hunt insights, career analytics, application success rate',
      ogTitle: 'Job Search Analytics & Insights | Lida Job Seek',
    };
  }

  getCoachHubSEO(): SEOConfig {
    return {
      title: 'AI Career Coach',
      description: 'Get personalized career guidance from our AI-powered coach. Improve your resume, prepare for interviews, and accelerate your job search success.',
      keywords: 'AI career coach, career guidance, interview preparation, resume tips, job search advice, career counseling',
      ogTitle: 'AI-Powered Career Coaching | Lida Job Seek',
    };
  }

  getProfileSEO(): SEOConfig {
    return {
      title: 'Your Profile',
      description: 'Manage your professional profile, preferences, and career information. Keep your job search organized and personalized.',
      keywords: 'profile management, career profile, professional profile, user settings',
      noIndex: true, // Profile pages are usually private
    };
  }

  getPricingSEO(): SEOConfig {
    return {
      title: 'Pricing Plans',
      description: 'Choose the perfect plan for your job search needs. Get access to premium features including AI coaching, unlimited applications tracking, and priority support.',
      keywords: 'pricing, subscription plans, premium features, job search tool pricing, career management pricing',
      ogTitle: 'Affordable Pricing Plans | Lida Job Seek',
    };
  }

  getLoginSEO(): SEOConfig {
    return {
      title: 'Sign In',
      description: 'Sign in to your Lida Job Seek account and continue your journey to landing your dream job.',
      keywords: 'login, sign in, account access',
      noIndex: true,
    };
  }

  getRegisterSEO(): SEOConfig {
    return {
      title: 'Create Account',
      description: 'Join thousands of successful job seekers. Create your free account and start organizing your job search today.',
      keywords: 'register, sign up, create account, join, free account',
      ogTitle: 'Start Your Job Search Journey | Lida Job Seek',
    };
  }

  getDecisionBoardSEO(): SEOConfig {
    return {
      title: 'Job Decision Board',
      description: 'Compare and evaluate your job offers side-by-side. Make informed career decisions with our comprehensive job offer comparison tool.',
      keywords: 'job comparison, offer comparison, job decision, compare offers, evaluate jobs, job offer analysis',
      ogTitle: 'Compare Job Offers | Lida Job Seek',
    };
  }

  getResourcesSEO(): SEOConfig {
    return {
      title: 'Career Resources',
      description: 'Access valuable career resources, guides, and tools to enhance your job search. From resume templates to interview tips.',
      keywords: 'career resources, job search resources, resume templates, interview guides, career guides',
      ogTitle: 'Free Career Resources & Guides | Lida Job Seek',
    };
  }

  getReviewsSEO(): SEOConfig {
    return {
      title: 'Self Reviews',
      description: 'Conduct self-assessments and track your professional growth. Reflect on your career journey and identify areas for improvement.',
      keywords: 'self review, self assessment, career reflection, professional development, growth tracking',
    };
  }
}
