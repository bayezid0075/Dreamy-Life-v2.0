import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from '../application/notification.service';
import { PushTokenService } from '../application/push-token.service';
import { RegisterPushTokenDto } from '../dto/create-notification.dto';
import { UserGuard } from '../guards/user.guard';

@Controller('notifications')
@UseGuards(UserGuard)
export class PushController {
  constructor(
    private notificationService: NotificationService,
    private pushTokenService: PushTokenService,
  ) {}

  @Get()
  async getUserNotifications(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationService.getUserNotifications(
      req.user.userId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const count = await this.notificationService.getUnreadCount(req.user.userId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.notificationService.markAsRead(id, req.user.userId);
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(req.user.userId);
  }

  @Post('register-push')
  async registerPushToken(@Req() req: any, @Body() dto: RegisterPushTokenDto) {
    return this.pushTokenService.register(
      req.user.userId,
      dto.token,
      dto.platform,
    );
  }

  @Post('unregister-push')
  async unregisterPushToken(@Body('token') token: string) {
    return this.pushTokenService.remove(token);
  }
}
