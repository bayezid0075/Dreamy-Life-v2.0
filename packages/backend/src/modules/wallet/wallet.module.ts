import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WalletService } from './application/services/wallet.service';
import { FundPaymentService } from './application/services/fund-payment.service';
import { WalletController } from './interfaces/controllers/wallet.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || 'super_secret_jwt_key',
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '100y' },
      }),
    }),
    NotificationsModule,
  ],
  controllers: [WalletController],
  providers: [WalletService, FundPaymentService],
  exports: [WalletService, FundPaymentService],
})
export class WalletModule {}
