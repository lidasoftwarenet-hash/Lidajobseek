import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { UserSettings } from './user-settings.entity';
import { UserProcessStages } from './user-process-stages.entity';
import { User } from './user.entity';

@Injectable()
export class UsersSettingsService {
    constructor(
        @InjectRepository(UserSettings)
        private readonly userSettingsRepository: EntityRepository<UserSettings>,
        @InjectRepository(UserProcessStages)
        private readonly userProcessStagesRepository: EntityRepository<UserProcessStages>,
        private readonly em: EntityManager,
    ) { }

    // User Settings methods
    async getSettings(userId: number): Promise<UserSettings | null> {
        return this.userSettingsRepository.findOne({ user: userId });
    }

    async getOrCreateSettings(userId: number): Promise<UserSettings> {
        let settings = await this.userSettingsRepository.findOne({ user: userId });
        
        if (!settings) {
            const user = await this.em.findOne(User, { id: userId });
            if (!user) {
                throw new Error('User not found');
            }
            
            const now = new Date();
            settings = this.userSettingsRepository.create({
                user,
                themePreference: 'light',
                fontSizePreference: 14,
                countryPreference: '',
                dateFormatPreference: 'DD/MM/YYYY',
                timeFormatPreference: '24',
                salaryCurrencyPreference: 'USD',
                createdAt: now,
                updatedAt: now,
            } as any);
            await this.em.persistAndFlush(settings);
        }
        
        return settings;
    }

    async updateSettings(userId: number, data: Partial<UserSettings>): Promise<UserSettings> {
        const settings = await this.getOrCreateSettings(userId);
        
        if (data.themePreference !== undefined) {
            settings.themePreference = data.themePreference;
        }
        if (data.fontSizePreference !== undefined) {
            settings.fontSizePreference = data.fontSizePreference;
        }
        if (data.countryPreference !== undefined) {
            settings.countryPreference = data.countryPreference;
        }
        if (data.dateFormatPreference !== undefined) {
            settings.dateFormatPreference = data.dateFormatPreference;
        }
        if (data.timeFormatPreference !== undefined) {
            settings.timeFormatPreference = data.timeFormatPreference;
        }
        if (data.salaryCurrencyPreference !== undefined) {
            settings.salaryCurrencyPreference = data.salaryCurrencyPreference;
        }
        
        settings.updatedAt = new Date();
        await this.em.persistAndFlush(settings);
        
        return settings;
    }

    // User Process Stages methods
    async getProcessStages(userId: number): Promise<string[]> {
        const userStages = await this.userProcessStagesRepository.findOne({ user: userId });
        
        if (userStages) {
            return userStages.stages;
        }
        
        // Return default stages if none exist
        return ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected', 'Unknown'];
    }

    async getOrCreateProcessStages(userId: number): Promise<UserProcessStages> {
        let stages = await this.userProcessStagesRepository.findOne({ user: userId });
        
        if (!stages) {
            const user = await this.em.findOne(User, { id: userId });
            if (!user) {
                throw new Error('User not found');
            }
            
            const now = new Date();
            stages = this.userProcessStagesRepository.create({
                user,
                stages: ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected', 'Unknown'],
                createdAt: now,
                updatedAt: now,
            } as any);
            await this.em.persistAndFlush(stages);
        }
        
        return stages;
    }

    async updateProcessStages(userId: number, stages: string[]): Promise<UserProcessStages> {
        const userStages = await this.getOrCreateProcessStages(userId);
        userStages.stages = stages;
        userStages.updatedAt = new Date();
        
        await this.em.persistAndFlush(userStages);
        
        return userStages;
    }

    async resetProcessStages(userId: number): Promise<UserProcessStages> {
        return this.updateProcessStages(userId, [
            'Applied', 
            'Phone Screen', 
            'Interview', 
            'Offer', 
            'Rejected', 
            'Unknown'
        ]);
    }

    // Combined preferences getter
    async getPreferences(userId: number) {
        const settings = await this.getOrCreateSettings(userId);
        const stages = await this.getProcessStages(userId);

        return {
            theme: settings.themePreference,
            fontSize: settings.fontSizePreference,
            country: settings.countryPreference,
            dateFormat: settings.dateFormatPreference,
            timeFormat: settings.timeFormatPreference,
            salaryCurrency: settings.salaryCurrencyPreference,
            processStages: stages,
        };
    }
}
