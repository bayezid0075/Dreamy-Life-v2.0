import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PostsModule } from './modules/posts/posts.module';
import { ReferralModule } from './modules/referral/referral.module';
import { MediaModule } from './modules/media/media.module';
import { AuthModule } from './modules/auth/auth.module';
import { MembershipModule } from './modules/membership/membership.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { AdminModule } from './modules/admin/admin.module';
import { ChatModule } from './modules/chat/chat.module';
import { VendorModule } from './modules/vendor/vendor.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { RechargeModule } from './modules/recharge/recharge.module';
import { WithdrawModule } from './modules/withdraw/withdraw.module';
import { SocialEarningsModule } from './modules/social-earnings/social-earnings.module';
import { BlogModule } from './modules/blog/blog.module';
import { ErrorsModule } from './modules/errors/errors.module';
import { HealthController } from './common/controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ErrorsModule,
    DatabaseModule,
    QueueModule,
    AuthModule,
    NotificationsModule,
    PostsModule,
    ReferralModule,
    MediaModule,
    MembershipModule,
    WalletModule,
    AdminModule,
    ChatModule,
    VendorModule,
    MarketplaceModule,
    RechargeModule,
    WithdrawModule,
    SocialEarningsModule,
    BlogModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
