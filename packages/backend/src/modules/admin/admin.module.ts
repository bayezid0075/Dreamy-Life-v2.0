import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminAuthController } from './admin-auth.controller';
import { VisitorController } from './interfaces/controllers/visitor.controller';
import { AdminService } from './admin.service';
import { VisitorService } from './services/visitor.service';
import { AdminGuard } from './guards/admin.guard';
import { AdminGateway } from './gateway/admin.gateway';
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
  controllers: [AdminController, AdminAuthController, VisitorController],
  providers: [AdminService, VisitorService, AdminGuard, PasswordService, AdminGateway],
  exports: [AdminService, VisitorService, AdminGateway],
})
export class AdminModule {}
