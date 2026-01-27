import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    nickname: string | null;
    name: string | null;
    role: UserRole;
    isApproved: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        nickname: dto.nickname,
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
        role: UserRole.USER,
        isApproved: false, // 관리자 승인 필요
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        name: user.name,
        role: user.role,
        isApproved: user.isApproved,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      // 실패한 로그인 기록
      await this.recordLoginHistory(user.id, ipAddress, userAgent, false);
      throw new UnauthorizedException('Invalid credentials');
    }

    // 승인되지 않은 사용자 체크 (ADMIN은 승인 필요 없음)
    if (!user.isApproved && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Account pending approval');
    }

    // 성공한 로그인 기록
    await this.recordLoginHistory(user.id, ipAddress, userAgent, true);

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        name: user.name,
        role: user.role,
        isApproved: user.isApproved,
      },
      ...tokens,
    };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string }> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = this.jwtService.sign(
      {
        sub: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role,
        type: 'access',
      },
      {
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION') || '30m',
      },
    );

    return { accessToken };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        name: true,
        phone: true,
        address: true,
        role: true,
        isApproved: true,
        createdAt: true,
      },
    });
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign(
      {
        sub: userId,
        email,
        role,
        type: 'access',
      },
      {
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION') || '30m',
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: userId,
        email,
        role,
        type: 'refresh',
        jti: uuidv4(),
      },
      {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
      },
    );

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(
    userId: string,
    token: string,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  private async recordLoginHistory(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    isSuccess: boolean = true,
  ): Promise<void> {
    await this.prisma.loginHistory.create({
      data: {
        userId,
        ipAddress,
        userAgent,
        isSuccess,
      },
    });
  }
}
