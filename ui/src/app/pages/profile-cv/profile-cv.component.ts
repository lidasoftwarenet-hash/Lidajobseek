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
  shareStatus: 'idle' | 'success' | 'error' = 'idle';
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
    this.shareStatus = 'idle';

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
          this.shareStatus = 'success';
          this.toastService.show(`CV sent successfully to ${email}`, 'success');
          this.shareEmail = ''; // Clear the input
          this.sendingCv = false;
        },
        error: (error) => {
          console.error('Failed to send CV:', error);
          this.shareStatus = 'error';
          this.toastService.show('Failed to send CV. Please try again.', 'error');
          this.sendingCv = false;
        }
      });
    } catch (error) {
      console.error('Error sharing CV:', error);
      this.shareStatus = 'error';
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

    const extractCountry = (country?: string, address?: string) => {
      const directCountry = (country || '').trim();
      if (directCountry) {
        return directCountry;
      }

      const normalizedAddress = (address || '').trim();
      if (!normalizedAddress) {
        return '';
      }

      const parts = normalizedAddress
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

      return parts.length ? parts[parts.length - 1] : '';
    };

    const currentUser = this.authService.getUser();
    const candidateName = (
      cv.fullName || currentUser?.name || currentUser?.email || 'Candidate'
    ).toString().trim();
    const candidatePhone = currentUser?.phone ? String(currentUser.phone).trim() : '';
    const candidateCountry = extractCountry(cv.country, cv.address);

    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 16;
    const marginTop = 20;
    const contentWidth = pageWidth - marginX * 2;
    const bottomLimit = pageHeight - 16;
    let y = marginTop;

    const colors = {
      navy: [23, 42, 76] as [number, number, number],
      slate: [71, 85, 105] as [number, number, number],
      light: [241, 245, 249] as [number, number, number],
      line: [226, 232, 240] as [number, number, number],
      text: [15, 23, 42] as [number, number, number],
      muted: [100, 116, 139] as [number, number, number],
    };

    const addPageIfNeeded = (requiredHeight = 8) => {
      if (y + requiredHeight > bottomLimit) {
        pdf.addPage();
        y = marginTop + 2;
      }
    };

    const sanitizeText = (value?: string) => (value || '').replace(/\s+/g, ' ').trim();

    const addWrappedParagraph = (
      text: string,
      options?: { bullet?: boolean; fontSize?: number; lineHeight?: number }
    ) => {
      const fontSize = options?.fontSize ?? 10.5;
      const lineHeight = options?.lineHeight ?? 5;
      const isBullet = options?.bullet ?? false;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(fontSize);
      pdf.setTextColor(...colors.text);

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
      pdf.setTextColor(...colors.navy);
      pdf.text('•', bulletX, y);
      pdf.setTextColor(...colors.text);
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

      addPageIfNeeded(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...colors.navy);
      pdf.text(title, marginX, y);
      y += 5;

      pdf.setDrawColor(...colors.line);
      pdf.line(marginX, y - 2.2, pageWidth - marginX, y - 2.2);

      if (asBullets && items.length > 1) {
        for (const item of items) {
          addWrappedParagraph(item, { bullet: true, fontSize: 10.2, lineHeight: 4.8 });
        }
      } else {
        addWrappedParagraph(safeContent, { fontSize: 10.2, lineHeight: 4.8 });
      }

      y += 3.6;
    };

    // Executive header
    pdf.setFillColor(...colors.navy);
    pdf.rect(0, 0, pageWidth, 44, 'F');

    pdf.setFillColor(...colors.light);
    pdf.rect(marginX, 14, contentWidth, 34, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(23);
    pdf.setTextColor(...colors.navy);
    pdf.text(candidateName, marginX + 4, 27);

    let headerLineY = 33;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10.5);
    pdf.setTextColor(...colors.slate);

    if (candidatePhone) {
      pdf.text(candidatePhone, marginX + 4, headerLineY);
      headerLineY += 5.2;
    }

    if (candidateCountry) {
      pdf.text(candidateCountry, marginX + 4, headerLineY);
      headerLineY += 5.2;
    }

    const profileLabel = this.useAi ? 'AI-Enhanced Resume' : 'Professional Resume';
    pdf.setFontSize(9.5);
    pdf.setTextColor(...colors.muted);
    pdf.text(profileLabel, marginX + 4, headerLineY);

    y = 56;

    pdf.setDrawColor(...colors.line);
    pdf.line(marginX, y - 2, pageWidth - marginX, y - 2);

    const isLinkedIn = /linkedin/i.test(sanitizeText(cv.links));
    if (isLinkedIn || sanitizeText(cv.title)) {
      addPageIfNeeded(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.muted);
      const introParts = [sanitizeText(cv.title), isLinkedIn ? 'LinkedIn / Portfolio linked in CV' : '']
        .filter(Boolean)
        .join('  •  ');
      if (introParts) {
        pdf.text(introParts, marginX, y + 2);
        y += 8;
      }
    }

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
      pdf.setTextColor(...colors.muted);
      pdf.text(candidateName, marginX, pageHeight - 8);
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth - marginX - 22, pageHeight - 8);
    }

    return pdf;
  }
}
