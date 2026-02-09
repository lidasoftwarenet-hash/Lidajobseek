import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Query,
  UseGuards,
  ForbiddenException,
  InternalServerErrorException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ShareProfileDto } from './dto/share-profile.dto';
import { SendCvEmailDto } from './dto/send-cv-email.dto';
import { PremiumGuard } from '../auth/premium.guard';
import { RequiresPremium } from '../auth/requires-premium.decorator';

const CV_UPLOAD_MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_CV_MIME_TYPES = ['application/pdf'];

const cvFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!ALLOWED_CV_MIME_TYPES.includes(file.mimetype)) {
    return cb(new BadRequestException('Only PDF files are allowed'), false);
  }
  cb(null, true);
};

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
        throw new ForbiddenException({
          type: 'unauthorized_scope',
          code: 'UNAUTHORIZED_SCOPE',
          message: 'AI-powered CV generation requires a premium account. Please upgrade your plan.',
        });
      }
    }
    
    return this.profilesService.getProfessionalCv(req.user.userId, useAi);
  }

  @Post('me/ai-suggestion')
  @UseGuards(PremiumGuard)
  @RequiresPremium()
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

  @Post('me/send-cv-email')
  @UseInterceptors(
    FileInterceptor('pdf', {
      limits: { fileSize: CV_UPLOAD_MAX_SIZE },
      fileFilter: cvFileFilter,
    }),
  )
  async sendCvByEmail(
    @Req() req: any,
    @Body() dto: SendCvEmailDto,
    @UploadedFile() pdf?: Express.Multer.File,
  ) {
    if (!dto?.email) {
      throw new BadRequestException({
        type: 'validation_error',
        code: 'EMAIL_REQUIRED',
        message: 'Email is required.',
      });
    }
    if (!pdf?.buffer && !dto.pdfBase64) {
      throw new BadRequestException({
        type: 'validation_error',
        code: 'PDF_REQUIRED',
        message: 'PDF is required.',
      });
    }
    try {
      await this.profilesService.sendCvByEmail(
        req.user.userId,
        dto.email,
        dto.pdfBase64,
        pdf?.buffer,
      );
      return { success: true, message: 'CV sent successfully' };
    } catch (error: any) {
      throw new InternalServerErrorException({
        type: 'server_error',
        code: 'SERVER_ERROR',
        message: error?.message || 'Failed to send CV email',
      });
    }
  }
}
