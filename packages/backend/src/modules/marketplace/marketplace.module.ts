import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MarketplaceService } from './application/services/marketplace.service';
import { MarketplaceGateway } from './application/services/marketplace.gateway';
import { MarketplaceController } from './interfaces/controllers/marketplace.controller';
import { AdminMarketplaceController } from './interfaces/controllers/admin-marketplace.controller';
import { WalletModule } from '../wallet/wallet.module';

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
    WalletModule,
  ],
  controllers: [MarketplaceController, AdminMarketplaceController],
  providers: [MarketplaceService, MarketplaceGateway],
  exports: [MarketplaceService, MarketplaceGateway],
})
export class MarketplaceModule {}
