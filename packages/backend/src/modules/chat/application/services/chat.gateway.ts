import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, string>();
  private userSockets = new Map<string, string>();

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token as string, {
        secret: process.env.JWT_SECRET || 'super_secret_jwt_key',
      });

      const userId = payload.userId;
      client.data.userId = userId;
      this.userSockets.set(userId, client.id);
      this.onlineUsers.set(userId, client.id);

      this.server.emit('user:online', { userId, isOnline: true });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      this.userSockets.delete(userId);
      this.onlineUsers.delete(userId);
      this.server.emit('user:offline', { userId, isOnline: false });
    }
  }

  @SubscribeMessage('conversation:join')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      content?: string;
      mediaUrl?: string;
      mediaType?: string;
      replyTo?: string;
    },
  ) {
    const userId = client.data.userId;
    const message = await this.chatService.sendMessage(
      data.conversationId,
      userId,
      data.content,
      data.mediaUrl,
      data.mediaType,
      data.replyTo,
    );

    this.server
      .to(`conversation:${data.conversationId}`)
      .emit('message:new', message);

    return message;
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    client.to(`conversation:${data.conversationId}`).emit('typing:start', {
      conversationId: data.conversationId,
      userId,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    client.to(`conversation:${data.conversationId}`).emit('typing:stop', {
      conversationId: data.conversationId,
      userId,
    });
  }

  @SubscribeMessage('message:read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; messageId: string },
  ) {
    const userId = client.data.userId;
    await this.chatService.markAsRead(
      data.conversationId,
      userId,
      data.messageId,
    );

    this.server.to(`conversation:${data.conversationId}`).emit('message:read', {
      conversationId: data.conversationId,
      userId,
      messageId: data.messageId,
    });
  }

  @SubscribeMessage('conversation:create')
  async handleCreateConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      type: 'direct' | 'group';
      memberIds: string[];
      name?: string;
      avatarUrl?: string;
    },
  ) {
    const userId = client.data.userId;
    const conversation = await this.chatService.createConversation(
      userId,
      data.type,
      data.memberIds,
      data.name,
      data.avatarUrl,
    );

    if (conversation.members) {
      for (const member of conversation.members) {
        const socketId = this.userSockets.get(member.id);
        if (socketId) {
          const memberSocket = this.server.sockets.sockets.get(socketId);
          memberSocket?.join(`conversation:${conversation.id}`);
          memberSocket?.emit('conversation:created', conversation);
        }
      }
    }

    return conversation;
  }

  @SubscribeMessage('user:status')
  handleUserStatus(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    return { userId, isOnline: true };
  }

  broadcastToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers.keys());
  }
}
