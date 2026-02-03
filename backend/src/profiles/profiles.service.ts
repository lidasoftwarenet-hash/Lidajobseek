import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Profile } from './profile.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { DeepSeekService } from '../ai/deepseek.service';

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
  ) {}

  async getOrCreateProfile(userId: number): Promise<Profile> {
    const existing = await this.profileRepository.findOne({ user: userId });
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
    const { about, topSkills, activity, oldCompanies, experience, privateProjects, education, certifications, links } = dto;
    Object.assign(profile, {
      about,
      topSkills,
      activity,
      oldCompanies,
      experience,
      privateProjects,
      education,
      certifications,
      links,
    });
    await this.em.flush();
    return profile;
  }

  async findByUserId(userId: number): Promise<Profile> {
    const profile = await this.profileRepository.findOne({ user: userId });
    if (!profile) {
      return this.getOrCreateProfile(userId);
    }
    return profile;
  }

  async getProfileWithLastCv(userId: number): Promise<Profile> {
    return this.findByUserId(userId);
  }

  async checkShareTarget(email: string): Promise<{ exists: boolean; userId?: number }>{
    const user = await this.usersService.findOne(email);
    if (!user) {
      return { exists: false };
    }
    return { exists: true, userId: user.id };
  }

  async getSharedProfile(senderUserId: number, recipientEmail: string): Promise<Profile> {
    const shareTarget = await this.usersService.findOne(recipientEmail);
    if (!shareTarget) {
      throw new NotFoundException('User not found');
    }

    return this.findByUserId(senderUserId);
  }

  async getProfessionalCv(userId: number, useAi: boolean): Promise<ProfessionalCvPayload> {
    const profile = await this.findByUserId(userId);
    const prompt = this.buildCvPrompt(profile);
    const aiResponse = useAi ? await this.deepSeekService.generateProfessionalCv(prompt) : prompt;
    const parsed = useAi ? this.parseAiResponse(aiResponse) : {};
    const now = new Date();
    const cvUrl = `/profile/cv?ai=${useAi ? 'true' : 'false'}`;

    profile.lastCvUrl = cvUrl;
    profile.lastCvGeneratedAt = now;
    profile.lastCvAi = useAi;
    await this.em.flush();

    return {
      about: parsed.about ?? profile.about ?? '',
      topSkills: parsed.topSkills ?? profile.topSkills ?? '',
      activity: parsed.activity ?? profile.activity ?? '',
      oldCompanies: parsed.oldCompanies ?? profile.oldCompanies ?? '',
      experience: parsed.experience ?? profile.experience ?? '',
      privateProjects: parsed.privateProjects ?? profile.privateProjects ?? '',
      education: parsed.education ?? profile.education ?? '',
      certifications: parsed.certifications ?? profile.certifications ?? '',
      links: parsed.links ?? profile.links ?? '',
      aiEnabled: useAi && this.deepSeekService.isEnabled(),
      lastCvUrl: profile.lastCvUrl,
      lastCvGeneratedAt: profile.lastCvGeneratedAt?.toISOString(),
      lastCvAi: profile.lastCvAi,
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
    } catch (error) {
      return {};
    }
  }
}