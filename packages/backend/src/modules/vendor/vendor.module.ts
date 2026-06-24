import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VendorService } from './application/services/vendor.service';
import { ProductService } from './application/services/product.service';
import { ResellingService } from './application/services/reselling.service';
import { ShipmentService } from './application/services/shipment.service';
import { PaymentService } from './application/services/payment.service';
import { VendorController } from './interfaces/controllers/vendor.controller';
import { ProductController } from './interfaces/controllers/product.controller';
import { ResellingController } from './interfaces/controllers/reselling.controller';
import { ShipmentController } from './interfaces/controllers/shipment.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ConfigModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || 'super_secret_jwt_key',
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '15m' },
      }),
    }),
  ],
  controllers: [
    ProductController,
    VendorController,
    ResellingController,
    ShipmentController,
  ],
  providers: [
    VendorService,
    ProductService,
    ResellingService,
    ShipmentService,
    PaymentService,
  ],
  exports: [VendorService, ProductService, ResellingService, ShipmentService],
})
export class VendorModule {}
