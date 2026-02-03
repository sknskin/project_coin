import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserRole, NotificationType, UserStatus, ApprovalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
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
    username: string;
    nickname: string | null;
    name: string;
    role: UserRole;
    status: UserStatus;
    approvalStatus: ApprovalStatus;
    isApproved: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

// 역할별 세션 시간 (분)
const SESSION_DURATION_BY_ROLE: Record<UserRole, number> = {
  USER: 30,
  ADMIN: 60,
  SYSTEM: 240,
};

// 로그인 시도 제한 설정
const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_DURATION_MINUTES = 10;
const WARNING_THRESHOLD = 3;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    // 이메일 중복 확인
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    // 아이디 중복 확인
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('이미 사용 중인 아이디입니다.');
    }

    // 닉네임 중복 확인 (닉네임이 있는 경우에만)
    if (dto.nickname) {
      const existingNickname = await this.prisma.user.findUnique({
        where: { nickname: dto.nickname },
      });
      if (existingNickname) {
        throw new ConflictException('이미 사용 중인 닉네임입니다.');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 주민등록번호 처리 (해시 저장 + 앞자리와 뒷자리 첫번째 저장)
    const [ssnFirst, ssnSecond] = dto.ssn.split('-');
    const ssnHash = await bcrypt.hash(dto.ssn, 10);
    const ssnGender = ssnSecond.charAt(0);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        nickname: dto.nickname || null,
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
        ssnHash,
        ssnFirst,
        ssnGender,
        role: UserRole.USER,
        status: UserStatus.INACTIVE, // 승인 전까지 비활성화
        approvalStatus: ApprovalStatus.PENDING,
        isApproved: false,
      },
    });

    // 관리자/시스템 사용자에게 알림 전송
    await this.notifyAdminsAboutNewRegistration(user);

    return {
      success: true,
      message: '회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.',
    };
  }

  private async notifyAdminsAboutNewRegistration(user: {
    id: string;
    email: string;
    nickname: string | null;
    name: string;
  }) {
    try {
      const admins = await this.prisma.user.findMany({
        where: {
          role: { in: [UserRole.ADMIN, UserRole.SYSTEM] },
          status: UserStatus.ACTIVE,
        },
        select: { id: true },
      });

      for (const admin of admins) {
        await this.notificationService.create(admin.id, {
          type: NotificationType.SYSTEM,
          title: '새로운 회원가입 요청',
          message: `${user.nickname || user.name}님이 회원가입을 요청했습니다.`,
          data: { userId: user.id, type: 'registration_request' },
        });
      }
    } catch (error) {
      console.error('Failed to notify admins:', error);
    }
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    // IP 기반 로그인 차단 확인
    if (ipAddress) {
      const blockStatus = await this.checkLoginBlock(ipAddress);
      if (blockStatus.isBlocked) {
        throw new ForbiddenException({
          message: `로그인 시도가 너무 많습니다. ${blockStatus.remainingMinutes}분 후에 다시 시도해주세요.`,
          code: 'LOGIN_BLOCKED',
          remainingMinutes: blockStatus.remainingMinutes,
        });
      }
    }

    // 이메일 또는 아이디로 사용자 찾기
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.emailOrUsername },
          { username: dto.emailOrUsername },
        ],
      },
    });

    if (!user) {
      // 로그인 실패 기록 (사용자를 찾지 못한 경우도 실패로 기록)
      if (ipAddress) {
        await this.recordLoginAttempt(ipAddress, false);
      }
      throw new UnauthorizedException('이메일/아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      await this.recordLoginHistory(user.id, ipAddress, userAgent, false);

      // 로그인 실패 시도 기록 및 경고/차단 처리
      if (ipAddress) {
        const attemptResult = await this.recordLoginAttempt(ipAddress, false);

        // 5회 이상 실패 시 차단하고 관리자에게 알림
        if (attemptResult.attemptCount >= MAX_LOGIN_ATTEMPTS) {
          await this.notifyAdminsAboutLoginBlock(ipAddress, attemptResult.attemptCount);
          throw new ForbiddenException({
            message: `로그인 시도가 너무 많습니다. ${BLOCK_DURATION_MINUTES}분 후에 다시 시도해주세요.`,
            code: 'LOGIN_BLOCKED',
            remainingMinutes: BLOCK_DURATION_MINUTES,
          });
        }

        // 3회 이상 실패 시 경고 메시지
        if (attemptResult.attemptCount >= WARNING_THRESHOLD) {
          throw new UnauthorizedException({
            message: `로그인에 ${attemptResult.attemptCount}회 실패하였습니다. 5회 이상 실패하는 경우 로그인이 10분동안 제한됩니다.`,
            code: 'LOGIN_WARNING',
            failedCount: attemptResult.attemptCount,
          });
        }
      }

      throw new UnauthorizedException('이메일/아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    // 승인되지 않은 사용자 체크
    if (user.approvalStatus === ApprovalStatus.PENDING) {
      throw new ForbiddenException('회원가입 승인 대기 중입니다. 관리자 승인 후 로그인이 가능합니다.');
    }

    if (user.approvalStatus === ApprovalStatus.REJECTED) {
      throw new ForbiddenException('회원가입이 거절되었습니다. 관리자에게 문의해주세요.');
    }

    // 비활성화된 사용자 체크
    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException('비활성화된 계정입니다. 관리자에게 문의해주세요.');
    }

    // 로그인 성공 - 실패 횟수 초기화
    if (ipAddress) {
      await this.recordLoginAttempt(ipAddress, true);
    }

    // 성공한 로그인 기록 및 lastLoginAt 업데이트
    await Promise.all([
      this.recordLoginHistory(user.id, ipAddress, userAgent, true),
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        nickname: user.nickname,
        name: user.name,
        role: user.role,
        status: user.status,
        approvalStatus: user.approvalStatus,
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

    const sessionDuration = SESSION_DURATION_BY_ROLE[storedToken.user.role] || 30;

    const accessToken = this.jwtService.sign(
      {
        sub: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role,
        type: 'access',
      },
      {
        expiresIn: `${sessionDuration}m`,
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
        username: true,
        nickname: true,
        name: true,
        phone: true,
        address: true,
        role: true,
        status: true,
        approvalStatus: true,
        isApproved: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }

  async checkEmailAvailability(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return !user;
  }

  async checkUsernameAvailability(username: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    return !user;
  }

  async checkNicknameAvailability(nickname: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { nickname } });
    return !user;
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const sessionDuration = SESSION_DURATION_BY_ROLE[role] || 30;

    const accessToken = this.jwtService.sign(
      {
        sub: userId,
        email,
        role,
        type: 'access',
      },
      {
        expiresIn: `${sessionDuration}m`,
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

  // IP 기반 로그인 차단 확인
  private async checkLoginBlock(ipAddress: string): Promise<{ isBlocked: boolean; remainingMinutes: number }> {
    const attempt = await this.prisma.loginAttempt.findUnique({
      where: { ipAddress },
    });

    if (!attempt || !attempt.blockedUntil) {
      return { isBlocked: false, remainingMinutes: 0 };
    }

    const now = new Date();
    if (attempt.blockedUntil > now) {
      const remainingMs = attempt.blockedUntil.getTime() - now.getTime();
      const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
      return { isBlocked: true, remainingMinutes };
    }

    // 차단 시간이 지났으면 초기화
    await this.prisma.loginAttempt.update({
      where: { ipAddress },
      data: {
        attemptCount: 0,
        blockedUntil: null,
      },
    });

    return { isBlocked: false, remainingMinutes: 0 };
  }

  // 로그인 시도 기록
  private async recordLoginAttempt(ipAddress: string, isSuccess: boolean): Promise<{ attemptCount: number }> {
    if (isSuccess) {
      // 로그인 성공 시 시도 횟수 초기화
      await this.prisma.loginAttempt.upsert({
        where: { ipAddress },
        create: {
          ipAddress,
          attemptCount: 0,
          lastAttemptAt: new Date(),
        },
        update: {
          attemptCount: 0,
          blockedUntil: null,
          lastAttemptAt: new Date(),
        },
      });
      return { attemptCount: 0 };
    }

    // 로그인 실패 시 시도 횟수 증가
    const attempt = await this.prisma.loginAttempt.upsert({
      where: { ipAddress },
      create: {
        ipAddress,
        attemptCount: 1,
        lastAttemptAt: new Date(),
      },
      update: {
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });

    // 5회 이상 실패 시 10분 차단
    if (attempt.attemptCount >= MAX_LOGIN_ATTEMPTS) {
      const blockedUntil = new Date();
      blockedUntil.setMinutes(blockedUntil.getMinutes() + BLOCK_DURATION_MINUTES);

      await this.prisma.loginAttempt.update({
        where: { ipAddress },
        data: { blockedUntil },
      });
    }

    return { attemptCount: attempt.attemptCount };
  }

  // 로그인 차단 시 관리자에게 알림
  private async notifyAdminsAboutLoginBlock(ipAddress: string, attemptCount: number) {
    try {
      const admins = await this.prisma.user.findMany({
        where: {
          role: { in: [UserRole.ADMIN, UserRole.SYSTEM] },
          status: UserStatus.ACTIVE,
        },
        select: { id: true },
      });

      for (const admin of admins) {
        await this.notificationService.create(admin.id, {
          type: NotificationType.SYSTEM,
          title: '로그인 시도 차단 알림',
          message: `IP ${ipAddress}에서 ${attemptCount}회 로그인 실패로 10분간 차단되었습니다.`,
          data: { ipAddress, attemptCount, type: 'login_blocked' },
        });
      }
    } catch (error) {
      console.error('Failed to notify admins about login block:', error);
    }
  }
}
