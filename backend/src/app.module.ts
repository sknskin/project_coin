import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UpbitModule } from './upbit/upbit.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { WebsocketModule } from './websocket/websocket.module';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationModule } from './notification/notification.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    UpbitModule,
    PortfolioModule,
    WebsocketModule,
    NotificationModule,
    ChatModule,
  ],
})
export class AppModule {}
