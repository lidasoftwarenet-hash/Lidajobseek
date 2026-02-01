import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.css'
})
export class PricingComponent {
  plans = [
    {
      name: 'Starter',
      subtitle: 'Essential',
      price: 'Free',
      period: 'Forever',
      description: 'Perfect for individuals starting their job search journey',
      features: [
        { name: 'Up to 10 active job applications', included: true },
        { name: 'Basic analytics dashboard', included: true },
        { name: 'Interview calendar', included: true },
        { name: 'Email notifications', included: true },
        { name: 'Mobile responsive design', included: true },
        { name: 'Community support', included: true },
        { name: 'Advanced analytics', included: false },
        { name: 'Priority support', included: false },
        { name: 'Custom integrations', included: false }
      ],
      buttonText: 'Get Started',
      buttonClass: 'btn-secondary',
      popular: false,
      badge: null
    },
    {
      name: 'Professional',
      subtitle: 'Pro',
      price: '$10',
      period: 'per month',
      description: 'Advanced tools for serious job seekers',
      features: [
        { name: 'Unlimited job applications', included: true },
        { name: 'Advanced analytics & insights', included: true },
        { name: 'AI-powered recommendations', included: true },
        { name: 'Interview prep resources', included: true },
        { name: 'Resume optimization tools', included: true },
        { name: 'Priority email support', included: true },
        { name: 'Export to PDF/Excel', included: true },
        { name: 'Custom email templates', included: true },
        { name: 'LinkedIn integration', included: true }
      ],
      buttonText: 'Start Free Trial',
      buttonClass: 'btn-primary',
      popular: true,
      badge: 'Most Popular'
    },
    {
      name: 'Enterprise',
      subtitle: 'Business',
      price: 'Custom',
      period: 'Contact us',
      description: 'Tailored solutions for teams and organizations',
      features: [
        { name: 'Everything in Professional', included: true },
        { name: 'Multi-user team accounts', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'Custom integrations & API access', included: true },
        { name: 'Advanced security & compliance', included: true },
        { name: 'Custom branding options', included: true },
        { name: 'SLA guarantee', included: true },
        { name: '24/7 priority phone support', included: true },
        { name: 'Onboarding & training', included: true }
      ],
      buttonText: 'Contact Sales',
      buttonClass: 'btn-secondary',
      popular: false,
      badge: 'Enterprise'
    }
  ];

  contactSales() {
    window.location.href = 'mailto:sales@lidasoftware.net?subject=Enterprise Plan Inquiry';
  }
}
