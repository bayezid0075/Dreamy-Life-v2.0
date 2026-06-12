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
import { HealthController } from './common/controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    QueueModule,
    AuthModule,
    NotificationsModule,
    PostsModule,
    ReferralModule,
    MediaModule,
    MembershipModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
