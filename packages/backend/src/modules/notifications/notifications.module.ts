import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationService } from './application/notification.service';
import { PushService } from './application/push.service';
import { PushTokenService } from './application/push-token.service';
import { NotificationController } from './interfaces/notification.controller';
import { PushController } from './interfaces/push.controller';
import { UserGuard } from './guards/user.guard';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'push-queue' }),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || 'super_secret_jwt_key',
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '15m' },
      }),
    }),
  ],
  controllers: [NotificationController, PushController],
  providers: [NotificationService, PushService, PushTokenService, UserGuard],
  exports: [NotificationService, PushService, PushTokenService, UserGuard],
})
export class NotificationsModule {}
