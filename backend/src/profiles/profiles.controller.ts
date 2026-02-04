import { Body, Controller, Get, Patch, Post, Req, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ShareProfileDto } from './dto/share-profile.dto';
import { AuthGuard } from '../auth/auth.guard';
import { PremiumGuard } from '../auth/premium.guard';
import { RequiresPremium } from '../auth/requires-premium.decorator';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  getMyProfile(@Req() req: any) {
    return this.profilesService.getProfileWithLastCv(req.user.userId);
  }

  @Patch('me')
  updateMyProfile(@Body() dto: UpdateProfileDto, @Req() req: any) {
    return this.profilesService.updateProfile(req.user.userId, dto);
  }

  @Post('share')
  async shareProfile(@Body() dto: ShareProfileDto, @Req() req: any) {
    const lookup = await this.profilesService.checkShareTarget(dto.email);
    return {
      exists: lookup.exists,
      userId: lookup.userId,
      profile: lookup.exists
        ? await this.profilesService.getSharedProfile(req.user.userId, dto.email)
        : null,
    };
  }

  @Get('me/professional-cv')
  getProfessionalCv(@Req() req: any, @Query('ai') ai?: string) {
    const useAi = ai !== 'false';
    
    // Check if AI is requested and user has premium access
    if (useAi) {
      const isPremium = req.user.pricingPlan === 'premium' || req.user.pricingPlan === 'enterprise';
      if (!isPremium) {
        throw new ForbiddenException('AI-powered CV generation requires a premium account. Please upgrade your plan.');
      }
    }
    
    return this.profilesService.getProfessionalCv(req.user.userId, useAi);
  }

  @Post('me/ai-suggestion')
  getAiSuggestion(
    @Req() req: any,
    @Body() dto: { field: string; currentValue?: string },
  ) {
    return this.profilesService.getFieldSuggestion(
      req.user.userId,
      dto.field,
      dto.currentValue,
    );
  }
}
