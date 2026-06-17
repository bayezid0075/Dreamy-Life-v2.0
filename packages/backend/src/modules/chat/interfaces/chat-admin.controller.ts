import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from '../application/services/chat.service';
import { AdminGuard } from '../../admin/guards/admin.guard';

@Controller('admin/chat')
@UseGuards(AdminGuard)
export class ChatAdminController {
  constructor(private chatService: ChatService) {}

  @Get('groups')
  async getGroupConversations() {
    return this.chatService.getGroupConversations();
  }

  @Get('groups/:id')
  async getGroupDetail(@Param('id') id: string) {
    return this.chatService.getConversationById(id);
  }

  @Get('groups/:id/messages')
  async getGroupMessages(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(
      id,
      parseInt(page || '1'),
      parseInt(limit || '50'),
    );
  }
}
