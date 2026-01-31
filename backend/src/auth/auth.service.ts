import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      // Convert MikroORM entity to plain object
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name }
    };
  }

  async register(registerDto: any) {
    const validCode = process.env.REGISTER;
    if (validCode && registerDto.code !== validCode) {
      throw new UnauthorizedException('Invalid verification code. Please contact Lida Software.');
    }

    const existingUser = await this.usersService.findOne(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    return this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name
    });
  }

  async verifyInvitationCode(code: string) {
    const validCode = process.env.REGISTER;
    if (validCode && code !== validCode) {
      throw new UnauthorizedException('Invalid verification code. Please contact Lida Software.');
    }
    return { success: true };
  }

  // Deprecated helper to keep old code valid if called, but implementation changed
  async validatePassword(password: string): Promise<boolean> {
    // Logic moved to validateUser
    return false;
  }
}
