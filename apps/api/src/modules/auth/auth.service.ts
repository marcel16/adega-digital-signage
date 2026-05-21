import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { AppLoggerService } from '../../common/logger/logger.service';
import { LoginDto, RegisterDto, RefreshTokenDto, UpdateProfileDto, ChangePasswordDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
    private appLogger: AppLoggerService,
  ) {}

  async login(dto: LoginDto) {
    const rateKey = `login:${dto.email}`;
    const rateCheck = await this.redis.rateLimit(rateKey, 5, 60);
    if (!rateCheck.allowed) {
      throw new UnauthorizedException('Too many login attempts. Try again later.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.blocked) {
      throw new UnauthorizedException('Account is blocked');
    }

    if (user.tenant?.blocked) {
      throw new UnauthorizedException('Tenant is blocked');
    }

    const valid = await argon2.verify(user.password, dto.password);
    if (!valid) {
      this.appLogger.audit('LOGIN_FAILED', 'User', user.id, user.id, { email: dto.email });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.redis.del(rateKey);

    const tokens = await this.generateTokens(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.appLogger.audit('LOGIN_SUCCESS', 'User', user.id, user.id, { email: dto.email });

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    if (dto.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: dto.tenantId } });
      if (!tenant) throw new BadRequestException('Tenant not found');
      if (tenant.blocked) throw new BadRequestException('Tenant is blocked');
    }

    const hashedPassword = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        tenantId: dto.tenantId || null,
        role: dto.tenantId ? 'TENANT_ADMIN' : 'SUPER_ADMIN',
      },
    });

    this.appLogger.audit('USER_REGISTERED', 'User', user.id, user.id, { email: dto.email });

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { tenant: true },
      });

      if (!user || user.blocked) {
        throw new UnauthorizedException('Invalid token');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      try {
        const payload = this.jwtService.verify(refreshToken, {
          secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        });
        const jti = payload.jti;
        if (jti) {
          await this.redis.set(`blacklist:${jti}`, '1', 86400 * 7);
        }
      } catch {}
    }
    this.appLogger.audit('LOGOUT', 'User', userId, userId);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    this.appLogger.audit('PROFILE_UPDATED', 'User', userId, userId);
    return this.sanitizeUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await argon2.verify(user.password, dto.currentPassword);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const hashed = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    this.appLogger.audit('PASSWORD_CHANGED', 'User', userId, userId);
  }

  async enable2fa(userId: string, secret: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret, twoFactorEnabled: true },
    });
    this.appLogger.audit('2FA_ENABLED', 'User', userId, userId);
  }

  async disable2fa(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: null, twoFactorEnabled: false },
    });
    this.appLogger.audit('2FA_DISABLED', 'User', userId, userId);
  }

  async verify2fa(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) return false;

    const { totp } = require('otplib');
    return totp.verify({ token: code, secret: user.twoFactorSecret });
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRATION || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { password, twoFactorSecret, ...rest } = user;
    return rest;
  }
}
