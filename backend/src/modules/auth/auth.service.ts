import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email já cadastrado');

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        passwordHash,
        nome: dto.nome,
        role: dto.role || 'operador',
        tenantId: dto.tenantId,
      },
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
      include: { tenant: true },
    });

    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    if (!user.ativo) throw new UnauthorizedException('Usuário desativado');
    if (user.tenant.status === 'inactive' || user.tenant.status === 'suspended') {
      throw new UnauthorizedException('Conta suspensa');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    await this.prisma.usuario.update({
      where: { id: user.id },
      data: { ultimoLogin: new Date() },
    });

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.usuario.findUnique({
        where: { id: payload.sub },
        include: { tenant: true },
      });

      if (!user || !user.ativo) throw new UnauthorizedException('Acesso negado');

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Token de refresh inválido');
    }
  }

  async getProfile(userId: string) {
    return this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
        avatarUrl: true,
        telefone: true,
        ativo: true,
        tenantId: true,
        ultimoLogin: true,
        createdAt: true,
        tenant: {
          select: { id: true, nome: true, slug: true, status: true },
        },
      },
    });
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });

    await this.prisma.usuario.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        tenantId: user.tenantId,
        tenantNome: user.tenant?.nome,
      },
    };
  }
}