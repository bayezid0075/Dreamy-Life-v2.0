import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VendorService } from './application/services/vendor.service';
import { ProductService } from './application/services/product.service';
import { ResellingService } from './application/services/reselling.service';
import { ShipmentService } from './application/services/shipment.service';
import { PaymentService } from './application/services/payment.service';
import { CategoryService } from './application/services/category.service';
import { VendorController } from './interfaces/controllers/vendor.controller';
import { ProductController } from './interfaces/controllers/product.controller';
import { ResellingController } from './interfaces/controllers/reselling.controller';
import { ShipmentController } from './interfaces/controllers/shipment.controller';
import { CategoryController } from './interfaces/controllers/category.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    ConfigModule,
    NotificationsModule,
    WalletModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || 'super_secret_jwt_key',
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '100y' },
      }),
    }),
  ],
  controllers: [
    ProductController,
    VendorController,
    ResellingController,
    ShipmentController,
    CategoryController,
  ],
  providers: [
    VendorService,
    ProductService,
    ResellingService,
    ShipmentService,
    PaymentService,
    CategoryService,
  ],
  exports: [VendorService, ProductService, ResellingService, ShipmentService, CategoryService],
})
export class VendorModule {}
