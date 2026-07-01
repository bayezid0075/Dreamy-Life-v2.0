import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>();

  constructor(private jwtService: JwtService) {}

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
      client.join(`user:${userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      this.userSockets.delete(userId);
    }
  }

  notifyUser(userId: string, notification: {
    id: string;
    title: string;
    body: string;
    icon?: string;
    category: string;
    createdAt: string;
  }) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(`user:${userId}`).emit('notification:new', notification);
    }
  }

  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}
