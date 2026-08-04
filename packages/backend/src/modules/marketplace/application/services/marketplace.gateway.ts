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

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/marketplace',
})
export class MarketplaceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>();

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

      const userId = payload.userId;
      client.data.userId = userId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
  }

  @SubscribeMessage('job:subscribe')
  handleJobSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jobId: string },
  ) {
    client.join(`job:${data.jobId}`);
  }

  @SubscribeMessage('job:unsubscribe')
  handleJobUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jobId: string },
  ) {
    client.leave(`job:${data.jobId}`);
  }

  // ─── Emit Methods ──────────────────────────────────────────────────────

  emitToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (!sockets || !this.server?.sockets?.sockets) return;
    for (const socketId of sockets) {
      const socket = this.server.sockets.sockets.get(socketId);
      socket?.emit(event, data);
    }
  }

  emitJobCreated(job: any, posterId: string) {
    this.server.emit('job:created', { job, posterId });
  }

  emitJobApproved(job: any) {
    this.server.emit('job:approved', { job });
  }

  emitJobRejected(job: any) {
    this.server.emit('job:rejected', { job });
    this.emitToUser(job.posterId, 'job:rejected', { job });
  }

  emitNewBid(bid: any, posterId: string) {
    this.emitToUser(posterId, 'job:bid:new', { bid });
  }

  emitBidAccepted(bid: any, bidderId: string) {
    this.emitToUser(bidderId, 'job:bid:accepted', { bid });
  }

  emitBidRejected(bid: any, bidderId: string) {
    this.emitToUser(bidderId, 'job:bid:rejected', { bid });
  }

  emitNewAssignment(assignment: any, workerId: string, posterId: string) {
    this.emitToUser(workerId, 'job:assignment:new', { assignment });
    this.emitToUser(posterId, 'job:assignment:new', { assignment });
  }

  emitNewSubmission(submission: any, posterId: string) {
    this.emitToUser(posterId, 'job:submission:new', { submission });
  }

  emitSubmissionApproved(submission: any, workerId: string, payAmount: number) {
    this.emitToUser(workerId, 'job:submission:approved', { submission, payAmount });
  }

  emitSubmissionRejected(submission: any, workerId: string) {
    this.emitToUser(workerId, 'job:submission:rejected', { submission });
  }

  emitJobCancelled(job: any, workerIds: string[]) {
    for (const workerId of workerIds) {
      this.emitToUser(workerId, 'job:cancelled', { job });
    }
    this.emitToUser(job.posterId, 'job:cancelled', { job });
  }

  emitPaymentReleased(jobId: string, workerId: string, amount: number) {
    this.emitToUser(workerId, 'job:payment:released', { jobId, amount });
  }

  emitJobUpdated(job: any) {
    this.server.to(`job:${job.id}`).emit('job:updated', { job });
  }
}
