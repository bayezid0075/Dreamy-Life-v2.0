import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/admin',
})
export class AdminGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private adminSockets = new Set<string>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token as string, {
        secret: process.env.JWT_SECRET || 'super_secret_jwt_key',
      });

      if (!payload.adminId) {
        client.disconnect();
        return;
      }

      client.data.adminId = payload.adminId;
      this.adminSockets.add(client.id);
      client.join('admins');
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.adminSockets.delete(client.id);
  }

  emitDashboardUpdate(event: string, data: any) {
    this.server.to('admins').emit(event, data);
  }

  emitUserUpdate(data: any) {
    this.server.to('admins').emit('user:update', data);
  }

  emitVisitorUpdate(data: any) {
    this.server.to('admins').emit('visitor:new', data);
  }

  emitStatsUpdate(data: any) {
    this.server.to('admins').emit('stats:update', data);
  }
}
