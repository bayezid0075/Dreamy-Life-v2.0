import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from '../application/notification.service';
import { PushService } from '../application/push.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { AdminGuard } from '../../admin/guards/admin.guard';

@Controller('admin/notifications')
@UseGuards(AdminGuard)
export class NotificationController {
  constructor(
    private notificationService: NotificationService,
    private pushService: PushService,
  ) {}

  @Post()
  async create(@Body() dto: CreateNotificationDto, @Req() req: any) {
    const notification = await this.notificationService.create({
      ...dto,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      createdBy: req.user.userId,
    });

    if (!dto.scheduledAt) {
      const broadcastResult = await this.notificationService.broadcast(notification.id);
      const pushResult = await this.pushService.sendPushToAll({
        title: dto.title,
        body: dto.body,
        icon: dto.icon,
        notificationId: notification.id,
      });

      return {
        notification,
        delivery: { ...broadcastResult, push: pushResult },
      };
    }

    return { notification };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.notificationService.findAll(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      status,
    );
  }

  @Get('stats')
  async getStats() {
    return this.notificationService.getOverallStats();
  }

  @Post(':id/send')
  async sendNotification(@Param('id') id: string) {
    const notif = await this.notificationService.findOne(id);
    const broadcastResult = await this.notificationService.broadcast(id);
    const pushResult = await this.pushService.sendPushToAll({
      title: notif?.title || '',
      body: notif?.body || '',
      notificationId: id,
    });
    return { notification: broadcastResult, push: pushResult };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const notification = await this.notificationService.findOne(id);
    const stats = await this.notificationService.getDeliveryStats(id);
    return { notification, stats };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.notificationService.remove(id);
  }
}
