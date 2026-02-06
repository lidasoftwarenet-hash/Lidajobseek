import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Profile } from './profile.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { DeepSeekService } from '../ai/deepseek.service';
import { MailService } from '../mail/mail.service';

export interface ProfessionalCvPayload {
  about: string;
  topSkills: string;
  activity: string;
  oldCompanies: string;
  experience: string;
  privateProjects: string;
  education: string;
  certifications: string;
  links: string;
  aiEnabled: boolean;
  lastCvUrl?: string;
  lastCvGeneratedAt?: string;
  lastCvAi?: boolean;
}

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: EntityRepository<Profile>,
    private readonly em: EntityManager,
    private readonly usersService: UsersService,
    private readonly deepSeekService: DeepSeekService,
    private readonly mailService: MailService,
  ) {}

  async getOrCreateProfile(userId: number): Promise<Profile> {
    const existing = await this.profileRepository.findOne({ user: { id: userId } });
    if (existing) {
      return existing;
    }

    const now = new Date();
    const profile = this.profileRepository.create({
      user: this.em.getReference(User, userId),
      createdAt: now,
      updatedAt: now,
    });
    await this.em.persistAndFlush(profile);
    return profile;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.getOrCreateProfile(userId);
    const patch = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );

    Object.assign(profile, patch);
    await this.em.flush();
    return profile;
  }

  async findByUserId(userId: number): Promise<Profile> {
    const profile = await this.profileRepository.findOne({ user: { id: userId } });
    if (!profile) {
      return this.getOrCreateProfile(userId);
    }
    return profile;
  }

  async getProfileWithLastCv(
    userId: number,
  ): Promise<
    Profile & { lastCvUrl?: string; lastCvGeneratedAt?: string | null; lastCvAi?: boolean }
  > {
    const profile = await this.findByUserId(userId);

    // Ensure last CV metadata is always serialized in a frontend-friendly format
    return {
      ...(profile as any),
      lastCvUrl: profile.lastCvUrl ?? undefined,
      lastCvGeneratedAt: profile.lastCvGeneratedAt
        ? profile.lastCvGeneratedAt.toISOString()
        : null,
      lastCvAi: profile.lastCvAi ?? undefined,
    };
  }

  async checkShareTarget(
    email: string,
  ): Promise<{ exists: boolean; userId?: number }> {
    const user = await this.usersService.findOne(email);
    if (!user) {
      return { exists: false };
    }
    return { exists: true, userId: user.id };
  }

  async getSharedProfile(
    senderUserId: number,
    recipientEmail: string,
  ): Promise<Profile> {
    const shareTarget = await this.usersService.findOne(recipientEmail);
    if (!shareTarget) {
      throw new NotFoundException('User not found');
    }

    return this.findByUserId(senderUserId);
  }

  async getProfessionalCv(
    userId: number,
    useAi: boolean,
  ): Promise<ProfessionalCvPayload> {
    try {
      const profile = await this.findByUserId(userId);
      const now = new Date();
      const cvUrl = `/profile/cv?ai=${useAi ? 'true' : 'false'}`;

      let cvData: Partial<ProfessionalCvPayload>;

      if (useAi && this.deepSeekService.isEnabled()) {
        // AI-enhanced version
        const prompt = this.buildCvPrompt(profile);
        const aiResponse =
          await this.deepSeekService.generateProfessionalCv(prompt);
        cvData = this.parseAiResponse(aiResponse);
      } else {
        // Template version - use formatted profile data
        cvData = this.formatTemplateCV(profile);
      }

      // Update profile with last generation info (optional: requires last_cv_* columns)
      const lastCvAi = useAi && this.deepSeekService.isEnabled();
      profile.lastCvUrl = cvUrl;
      profile.lastCvGeneratedAt = now;
      profile.lastCvAi = lastCvAi;
      try {
        await this.em.flush();
      } catch (flushError: any) {
        // If DB is missing last_cv_* columns, CV still works; only "last generated" isn't persisted
        if (flushError?.code === '42703' || flushError?.message?.includes('last_cv')) {
          console.warn(
            'Profile last_cv_* columns missing. Run backend/SQL_ADD_PROFILE_LAST_CV_COLUMNS.sql. CV data still returned.',
          );
        } else {
          throw flushError;
        }
      }

      return {
        about: cvData.about ?? profile.about ?? '',
        topSkills: cvData.topSkills ?? profile.topSkills ?? '',
        activity: cvData.activity ?? profile.activity ?? '',
        oldCompanies: cvData.oldCompanies ?? profile.oldCompanies ?? '',
        experience: cvData.experience ?? profile.experience ?? '',
        privateProjects: cvData.privateProjects ?? profile.privateProjects ?? '',
        education: cvData.education ?? profile.education ?? '',
        certifications: cvData.certifications ?? profile.certifications ?? '',
        links: cvData.links ?? profile.links ?? '',
        aiEnabled: useAi && this.deepSeekService.isEnabled(),
        lastCvUrl: profile.lastCvUrl,
        lastCvGeneratedAt: profile.lastCvGeneratedAt?.toISOString(),
        lastCvAi: profile.lastCvAi,
      };
    } catch (error) {
      console.error('Error in getProfessionalCv:', error);
      throw error;
    }
  }

  private formatTemplateCV(profile: Profile): Partial<ProfessionalCvPayload> {
    // Return the profile data as-is for template version
    // The template just displays the raw profile content in a clean format
    return {
      about: profile.about,
      topSkills: profile.topSkills,
      activity: profile.activity,
      oldCompanies: profile.oldCompanies,
      experience: profile.experience,
      privateProjects: profile.privateProjects,
      education: profile.education,
      certifications: profile.certifications,
      links: profile.links,
    };
  }

  private buildCvPrompt(profile: Profile): string {
    return `Create a professional CV summary in JSON format with keys: about, topSkills, activity, oldCompanies, experience, privateProjects, education, certifications, links. Use the provided user data below.

About: ${profile.about ?? ''}
Top Skills: ${profile.topSkills ?? ''}
Activity: ${profile.activity ?? ''}
Old Companies: ${profile.oldCompanies ?? ''}
Experience: ${profile.experience ?? ''}
Private Projects: ${profile.privateProjects ?? ''}
Education: ${profile.education ?? ''}
Certifications: ${profile.certifications ?? ''}
Links: ${profile.links ?? ''}
`;
  }

  private parseAiResponse(response: string): Partial<ProfessionalCvPayload> {
    try {
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        return {};
      }
      const jsonText = response.slice(jsonStart, jsonEnd + 1);
      return JSON.parse(jsonText) as Partial<ProfessionalCvPayload>;
    } catch {
      return {};
    }
  }

  async getFieldSuggestion(
    userId: number,
    field: string,
    currentValue?: string,
  ): Promise<{ suggestion: string; aiEnabled: boolean }> {
    if (!this.deepSeekService.isEnabled()) {
      return {
        suggestion: '',
        aiEnabled: false,
      };
    }

    const profile = await this.findByUserId(userId);
    const fieldPrompts: { [key: string]: string } = {
      about:
        'Write a concise, professional "About" section (2-3 sentences) for a career profile. Make it compelling and highlight key strengths.',
      topSkills:
        'List 5-8 top professional skills relevant to their field, comma-separated. Be specific and industry-relevant.',
      experience:
        'Summarize professional experience in 3-4 sentences. Focus on accomplishments, impact, and years of experience.',
      oldCompanies:
        'List previous companies worked at, with brief descriptions if helpful.',
      activity:
        'Describe professional activities like talks, publications, community work, awards (2-3 sentences).',
      privateProjects:
        'Describe 2-3 notable side projects or initiatives, focusing on impact and technologies used.',
      education:
        'List educational background including degrees, institutions, and relevant training.',
      certifications:
        'List professional certifications and licenses held.',
      links:
        'Suggest types of links to include (portfolio, GitHub, LinkedIn, etc.) with brief explanations.',
    };

    const prompt = `${fieldPrompts[field] || 'Provide helpful content for this profile field.'}

Context from profile:
${currentValue ? `Current value: ${currentValue}` : 'Field is empty'}
${profile.about ? `About: ${profile.about.substring(0, 200)}` : ''}
${profile.topSkills ? `Skills: ${profile.topSkills.substring(0, 200)}` : ''}
${profile.experience ? `Experience: ${profile.experience.substring(0, 200)}` : ''}

Provide a helpful suggestion or example. Keep it concise and actionable.`;

    const suggestion =
      await this.deepSeekService.generateProfessionalCv(prompt);

    return {
      suggestion: suggestion.trim(),
      aiEnabled: true,
    };
  }

  async sendCvByEmail(
    userId: number,
    email: string,
    pdfBase64?: string,
    pdfBuffer?: Buffer,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    const senderName = user?.name || user?.email || 'A user';

    const resolvedPdfBuffer =
      pdfBuffer ?? (pdfBase64 ? Buffer.from(pdfBase64, 'base64') : null);

    if (!resolvedPdfBuffer) {
      throw new Error('PDF content is required');
    }

    await this.mailService.sendCvByEmail(email, resolvedPdfBuffer, senderName);
  }
}
