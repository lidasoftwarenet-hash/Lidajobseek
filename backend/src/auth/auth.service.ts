import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {}

  async validatePassword(password: string): Promise<boolean> {
    // Check if password exists in the database
    const passRecord = await this.prisma.pass.findFirst({
      where: { value: password }
    });
    
    return !!passRecord;
  }
}
