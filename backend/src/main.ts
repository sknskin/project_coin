/**
 * @fileoverview NestJS 애플리케이션 진입점
 * @description 서버 초기화, 미들웨어 설정, Swagger 문서화 등 애플리케이션 부트스트랩 담당
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

/**
 * 애플리케이션 부트스트랩 함수
 * @description NestJS 애플리케이션을 초기화하고 필요한 미들웨어와 설정을 적용
 */
async function bootstrap() {
  // NestJS 애플리케이션 인스턴스 생성
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 환경 설정 서비스에서 설정값 로드
  const configService = app.get(ConfigService);
  const port = configService.get<number>('BACKEND_PORT') || 3001;
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

  // CORS 설정: 프론트엔드 도메인에서의 요청 허용
  app.enableCors({
    origin: frontendUrl,
    credentials: true, // 쿠키 전송 허용
  });

  // 쿠키 파서 미들웨어 적용
  app.use(cookieParser());

  // 전역 유효성 검사 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // DTO에 정의되지 않은 속성 자동 제거
      forbidNonWhitelisted: true, // 정의되지 않은 속성이 있으면 요청 거부
      transform: true,           // 요청 데이터를 DTO 클래스 인스턴스로 자동 변환
    }),
  );

  // 모든 라우트에 '/api' 접두사 추가
  app.setGlobalPrefix('api');

  // Swagger API 문서 설정
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Project Coin API')
    .setDescription(`
      ## 프로젝트 코인 백엔드 API 문서

      업비트 API를 활용한 실시간 코인 시세 조회 및 포트폴리오 관리 시스템의 REST API 문서입니다.


      ### 주요 기능
      
      - 인증: JWT 기반 로그인/회원가입
      - 코인 시세: 업비트 API 연동 실시간 시세
      - 포트폴리오: 보유 코인 및 수익률 관리
      - 채팅: 실시간 1:1 및 그룹 채팅
      - 공지사항: 게시판 CRUD, 댓글, 좋아요
      - 관리자: 회원 관리, 통계
    `)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT 토큰을 입력하세요',
        in: 'header',
      },
      'access-token', // 이 이름으로 @ApiBearerAuth() 데코레이터에서 참조
    )
    .addTag('Auth', '인증 관련 API (로그인, 회원가입, 토큰 갱신)')
    .addTag('Users', '사용자 정보 조회')
    .addTag('MyPage', '마이페이지 (프로필 수정, 비밀번호 변경)')
    .addTag('Admin', '관리자 전용 API (회원 관리)')
    .addTag('Upbit', '업비트 코인 시세 API')
    .addTag('Portfolio', '포트폴리오 관리')
    .addTag('Chat', '실시간 채팅')
    .addTag('Announcement', '공지사항 게시판')
    .addTag('Notification', '알림')
    .addTag('Statistics', '통계')
    .addTag('Menu', '메뉴 관리')
    .addTag('News', '코인 뉴스')
    .build();

  // Swagger 문서 생성 및 '/api/docs' 경로에 마운트
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 새로고침해도 인증 정보 유지
      tagsSorter: 'alpha',        // 태그 알파벳 순 정렬
      operationsSorter: 'alpha',  // API 알파벳 순 정렬
    },
  });

  // 업로드 파일 정적 제공 설정
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // 서버 시작
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
