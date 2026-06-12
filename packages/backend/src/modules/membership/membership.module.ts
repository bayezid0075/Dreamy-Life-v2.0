import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MembershipService } from './application/services/membership.service';
import { MembershipController } from './interfaces/controllers/membership.controller';

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
  controllers: [MembershipController],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}
