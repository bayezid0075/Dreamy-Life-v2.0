import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ReferralService } from './application/services/referral.service';
import { ReferralController } from './interfaces/controllers/referral.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || 'super_secret_jwt_key',
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '15m' },
      }),
    }),
  ],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
