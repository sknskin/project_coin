import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { StatisticsService } from './statistics.service';
import { UserRole } from '@prisma/client';

class TrackVisitorDto {
  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  referrer?: string;
}

class PeriodStatsQueryDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsString()
  period?: string;
}

@Controller('statistics')
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @Post('track')
  trackVisitor(@Body() dto: TrackVisitorDto) {
    return this.statisticsService.trackVisitor(
      dto.sessionId,
      dto.ipAddress,
      dto.userAgent,
      dto.referrer,
    );
  }

  @Get('realtime')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getRealTimeStats() {
    return this.statisticsService.getRealTimeStats();
  }

  @Get('historical')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getHistoricalStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.statisticsService.getHistoricalStats(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('historical/period')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getHistoricalByPeriod(@Query() query: PeriodStatsQueryDto) {
    return this.statisticsService.getHistoricalByPeriod(
      new Date(query.startDate),
      new Date(query.endDate),
      (query.period as 'daily' | 'monthly' | 'yearly') || 'daily',
    );
  }

  @Get('logins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getLoginStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.statisticsService.getLoginStats(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('registrations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getRegistrationStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.statisticsService.getRegistrationStats(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('announcements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getAnnouncementStats(@Query() query: PeriodStatsQueryDto) {
    return this.statisticsService.getAnnouncementStats(
      new Date(query.startDate),
      new Date(query.endDate),
      (query.period as 'daily' | 'monthly' | 'yearly') || 'daily',
    );
  }

  @Get('announcements/totals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getAnnouncementTotals() {
    return this.statisticsService.getAnnouncementTotals();
  }

  @Get('chat')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getChatStats(@Query() query: PeriodStatsQueryDto) {
    return this.statisticsService.getChatStats(
      new Date(query.startDate),
      new Date(query.endDate),
      (query.period as 'daily' | 'monthly' | 'yearly') || 'daily',
    );
  }

  @Get('chat/totals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getChatTotals() {
    return this.statisticsService.getChatTotals();
  }

  @Get('users/detail')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getUserDetailStats() {
    return this.statisticsService.getUserDetailStats();
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getNotificationStats(@Query() query: PeriodStatsQueryDto) {
    return this.statisticsService.getNotificationStats(
      new Date(query.startDate),
      new Date(query.endDate),
      (query.period as 'daily' | 'monthly' | 'yearly') || 'daily',
    );
  }
}
