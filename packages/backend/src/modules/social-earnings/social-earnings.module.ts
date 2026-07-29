import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { SocialEarningsService } from './application/social-earnings.service';
import { SocialEarningsController } from './interfaces/social-earnings.controller';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'super_secret_jwt_key',
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [SocialEarningsController],
  providers: [SocialEarningsService],
  exports: [SocialEarningsService],
})
export class SocialEarningsModule {}
