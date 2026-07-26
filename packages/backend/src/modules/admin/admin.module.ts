import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminAuthController } from './admin-auth.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { WalletModule } from '../wallet/wallet.module';
import { VendorModule } from '../vendor/vendor.module';
import { PasswordService } from '../auth/domain/services/password.service';

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
    VendorModule,
  ],
  controllers: [AdminController, AdminAuthController],
  providers: [AdminService, AdminGuard, PasswordService],
  exports: [AdminService, AdminGuard],
})
export class AdminModule {}
