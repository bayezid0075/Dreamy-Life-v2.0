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
import { ChatService } from '../application/services/chat.service';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { CreateGroupDto } from '../dto/create-group.dto';
import { UserGuard } from '../../notifications/guards/user.guard';

@Controller('chat')
@UseGuards(UserGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('conversations')
  async getConversations(@Req() req: any) {
    return this.chatService.getConversations(req.user.userId);
  }

  @Post('conversations')
  async createConversation(@Body() dto: CreateConversationDto, @Req() req: any) {
    return this.chatService.createConversation(
      req.user.userId,
      dto.type,
      dto.memberIds,
      dto.name,
      dto.avatarUrl,
    );
  }

  @Post('conversations/group')
  async createGroup(@Body() dto: CreateGroupDto, @Req() req: any) {
    return this.chatService.createConversation(
      req.user.userId,
      'group',
      dto.memberIds,
      dto.name,
      dto.avatarUrl,
    );
  }

  @Get('conversations/:id')
  async getConversation(@Param('id') id: string) {
    const conv = await this.chatService.getConversationById(id);
    if (!conv) return { error: 'Conversation not found' };
    return conv;
  }

  @Get('conversations/:id/messages')
  async getMessages(
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

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Req() req: any,
  ) {
    return this.chatService.sendMessage(
      id,
      req.user.userId,
      dto.content,
      dto.mediaUrl,
      dto.mediaType,
      dto.replyTo,
    );
  }

  @Post('conversations/:id/read')
  async markAsRead(
    @Param('id') id: string,
    @Body('messageId') messageId: string,
    @Req() req: any,
  ) {
    await this.chatService.markAsRead(id, req.user.userId, messageId);
    return { success: true };
  }

  @Post('conversations/:id/members')
  async addMember(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Req() req: any,
  ) {
    return this.chatService.addMemberToGroup(id, userId, req.user.userId);
  }

  @Delete('conversations/:id/members/:userId')
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    await this.chatService.removeMemberFromGroup(id, userId, req.user.userId);
    return { deleted: true };
  }

  @Get('users/search')
  async searchUsers(@Query('q') query: string, @Req() req: any) {
    return this.chatService.searchUsers(query, req.user.userId);
  }

  @Get('downline-users')
  async getDownlineUsers(@Req() req: any) {
    return this.chatService.getDownlineUsers(req.user.userId);
  }
}
