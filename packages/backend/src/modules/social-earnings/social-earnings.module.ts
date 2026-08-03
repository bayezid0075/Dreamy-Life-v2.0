import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SocialEarningsService } from './application/social-earnings.service';
import { SocialEarningsController } from './interfaces/social-earnings.controller';

@Module({
  imports: [
    DatabaseModule,
    NotificationsModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'super_secret_jwt_key',
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '100y' },
      }),
    }),
  ],
  controllers: [SocialEarningsController],
  providers: [SocialEarningsService],
  exports: [SocialEarningsService],
})
export class SocialEarningsModule {}
