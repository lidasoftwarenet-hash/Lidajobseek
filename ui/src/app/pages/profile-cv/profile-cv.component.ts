import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProfilesService } from '../../services/profiles.service';
import { timeout, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile-cv',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile-cv.component.html',
  styleUrls: ['./profile-cv.component.css']
})
export class ProfileCvComponent implements OnInit {
  loading = false;
  profile: any = null;
  cvData: any = null;
  downloadingPdf = false;
  sendingCv = false;
  shareEmail = '';
  shareResult: { exists: boolean } | null = null;
  useAi = false;
  showUpgradePrompt = false;

  constructor(
    private profilesService: ProfilesService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const aiParam = params.get('ai');
      this.useAi = aiParam === 'true';
      
      if (this.useAi && !this.authService.isPremiumUser()) {
        this.showUpgradePrompt = true;
        this.loading = false;
      } else {
        this.showUpgradePrompt = false;
        this.fetchProfile();
      }
    });
  }

  fetchProfile() {
    this.loading = true;
    this.profilesService.getMyProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.fetchProfessionalCv();
      },
      error: () => {
        this.toastService.show('Failed to load CV preview', 'error');
        this.loading = false;
      }
    });
  }

  fetchProfessionalCv() {
    this.profilesService.getProfessionalCv(this.useAi).subscribe({
      next: (data) => {
        this.cvData = data;
        this.loading = false;
      },
      error: (error) => {
        if (this.useAi && (error.status === 403 || error.error?.message?.includes('premium'))) {
          this.showUpgradePrompt = true;
        } else {
          this.toastService.show('Failed to load CV', 'error');
        }
        this.loading = false;
      }
    });
  }

  async copyToClipboard() {
    const cv = this.cvData || this.profile;
    const text = `
CAREER PROFILE
${cv.about || ''}

TOP SKILLS
${cv.topSkills || ''}

EXPERIENCE
${cv.experience || ''}

OLD COMPANIES
${cv.oldCompanies || ''}

ACTIVITY
${cv.activity || ''}

PRIVATE PROJECTS
${cv.privateProjects || ''}

EDUCATION
${cv.education || ''}

CERTIFICATIONS
${cv.certifications || ''}

LINKS
${cv.links || ''}
    `.trim();

    try {
      await navigator.clipboard.writeText(text);
      this.toastService.show('CV copied to clipboard!', 'success');
    } catch (err) {
      this.toastService.show('Failed to copy', 'error');
    }
  }

  printCv() {
    window.print();
  }

  downloadAsText() {
    const cv = this.cvData || this.profile;
    const text = `CAREER PROFILE\n${cv.about || ''}\n\nTOP SKILLS\n${cv.topSkills || ''}\n\nEXPERIENCE\n${cv.experience || ''}\n\nOLD COMPANIES\n${cv.oldCompanies || ''}\n\nACTIVITY\n${cv.activity || ''}\n\nPRIVATE PROJECTS\n${cv.privateProjects || ''}\n\nEDUCATION\n${cv.education || ''}\n\nCERTIFICATIONS\n${cv.certifications || ''}\n\nLINKS\n${cv.links || ''}`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cv-${this.useAi ? 'ai-enhanced' : 'template'}-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.toastService.show('CV downloaded as text file', 'success');
  }

  async downloadAsPdf() {
    this.downloadingPdf = true;
    try {
      const pdf = await this.buildProfessionalPdf();
      pdf.save(`cv-${this.useAi ? 'ai-enhanced' : 'template'}-${new Date().toISOString().split('T')[0]}.pdf`);

      this.toastService.show('CV downloaded as PDF!', 'success');
    } catch (error) {
      console.error('PDF generation error:', error);
      this.toastService.show('PDF download failed. Try print or text download.', 'error');
    } finally {
      this.downloadingPdf = false;
    }
  }

  async generatePdfBlob(): Promise<Blob | null> {
    try {
      const pdf = await this.buildProfessionalPdf();
      
      const pdfOutput = pdf.output('blob');

      return pdfOutput as Blob;
    } catch (error) {
      console.error('PDF generation error:', error);
      return null;
    }
  }

  async shareCv() {
    const email = this.shareEmail.trim();
    if (!email) {
      this.toastService.show('Please enter an email address', 'warning');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.toastService.show('Please enter a valid email address', 'warning');
      return;
    }

    this.sendingCv = true;
    
    try {
      // Generate PDF as blob
      const pdfBlob = await this.generatePdfBlob();
      
      if (!pdfBlob) {
        this.toastService.show('Failed to generate PDF. Please try again.', 'error');
        this.sendingCv = false;
        return;
      }

      // Send via email
      this.profilesService.sendCvByEmail(email, pdfBlob).pipe(
        timeout(20000),
        catchError((err) => {
          return throwError(() => err);
        })
      ).subscribe({
        next: () => {
          this.shareResult = { exists: true };
          this.toastService.show(`CV sent successfully to ${email}`, 'success');
          this.shareEmail = ''; // Clear the input
          this.sendingCv = false;
        },
        error: (error) => {
          console.error('Failed to send CV:', error);
          this.toastService.show('Failed to send CV. Please try again.', 'error');
          this.sendingCv = false;
        }
      });
    } catch (error) {
      console.error('Error sharing CV:', error);
      this.toastService.show('Failed to share CV. Please try again.', 'error');
      this.sendingCv = false;
    }
  }

  private async buildProfessionalPdf() {
    const jsPDF = (await import('jspdf')).default;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const cv = this.cvData || this.profile;
    if (!cv) {
      throw new Error('CV data not found');
    }

    const currentUser = this.authService.getUser();
    const candidateName =
      (currentUser?.name || currentUser?.email || 'Candidate').toString();
    const candidateEmail = currentUser?.email ? String(currentUser.email) : '';

    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 16;
    const marginTop = 16;
    const contentWidth = pageWidth - marginX * 2;
    const bottomLimit = pageHeight - 18;
    let y = marginTop;

    const addPageIfNeeded = (requiredHeight = 8) => {
      if (y + requiredHeight > bottomLimit) {
        pdf.addPage();
        y = marginTop;
      }
    };

    const addWrappedParagraph = (
      text: string,
      options?: { bullet?: boolean; fontSize?: number; lineHeight?: number }
    ) => {
      const fontSize = options?.fontSize ?? 10.5;
      const lineHeight = options?.lineHeight ?? 5;
      const isBullet = options?.bullet ?? false;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(fontSize);

      if (!text.trim()) {
        return;
      }

      if (!isBullet) {
        const lines = pdf.splitTextToSize(text, contentWidth) as string[];
        for (const line of lines) {
          addPageIfNeeded(lineHeight + 1);
          pdf.text(line, marginX, y);
          y += lineHeight;
        }
        return;
      }

      const bulletX = marginX;
      const bulletTextX = marginX + 5;
      const bulletWidth = contentWidth - 5;
      const bulletLines = pdf.splitTextToSize(text, bulletWidth) as string[];
      if (!bulletLines.length) {
        return;
      }

      addPageIfNeeded(lineHeight + 1);
      pdf.text('•', bulletX, y);
      pdf.text(bulletLines[0], bulletTextX, y);
      y += lineHeight;

      for (let i = 1; i < bulletLines.length; i++) {
        addPageIfNeeded(lineHeight + 1);
        pdf.text(bulletLines[i], bulletTextX, y);
        y += lineHeight;
      }
    };

    const toListItems = (content?: string): string[] => {
      if (!content) {
        return [];
      }
      return content
        .split(/\r?\n|[•\-|;]+/g)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    };

    const addSection = (
      title: string,
      content?: string,
      asBullets: boolean = false,
    ) => {
      const safeContent = (content || '').trim();
      if (!safeContent) {
        return;
      }

      const items = asBullets ? toListItems(safeContent) : [];

      addPageIfNeeded(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11.5);
      pdf.setTextColor(27, 52, 90);
      pdf.text(title, marginX, y);
      y += 6;

      pdf.setDrawColor(230, 235, 243);
      pdf.line(marginX, y - 3, pageWidth - marginX, y - 3);

      pdf.setTextColor(20, 20, 20);

      if (asBullets && items.length > 1) {
        for (const item of items) {
          addWrappedParagraph(item, { bullet: true });
        }
      } else {
        addWrappedParagraph(safeContent);
      }

      y += 3;
    };

    // Header strip
    pdf.setFillColor(242, 246, 252);
    pdf.rect(marginX, y - 7, contentWidth, 26, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(20, 20, 20);
    pdf.text(candidateName, marginX + 3, y + 2);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(70, 70, 70);
    pdf.text('Professional CV', marginX + 3, y + 9);

    const headerMeta = [
      candidateEmail,
      cv.links ? 'Portfolio links included' : '',
      `${this.useAi ? 'AI-Enhanced' : 'Template'} Version`
    ]
      .filter(Boolean)
      .join('  •  ');

    if (headerMeta) {
      pdf.setFontSize(9.5);
      const metaLines = pdf.splitTextToSize(headerMeta, contentWidth - 6) as string[];
      for (const metaLine of metaLines) {
        pdf.text(metaLine, marginX + 3, y + 15);
        y += 4.5;
      }
    }

    y += 14;

    pdf.setDrawColor(220, 220, 220);
    pdf.line(marginX, y, pageWidth - marginX, y);
    y += 8;

    addSection('Professional Summary', cv.about);
    addSection('Top Skills', cv.topSkills, true);
    addSection('Experience', cv.experience);
    addSection('Career History / Old Companies', cv.oldCompanies, true);
    addSection('Activity', cv.activity);
    addSection('Private Projects', cv.privateProjects);
    addSection('Education', cv.education, true);
    addSection('Certifications', cv.certifications, true);
    addSection('Links', cv.links, true);

    const pageCount = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(130, 130, 130);
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth - marginX - 22, pageHeight - 8);
    }

    return pdf;
  }
}
