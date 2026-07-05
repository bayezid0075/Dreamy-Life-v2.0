import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { initializeApp, cert, App } from 'firebase-admin/app';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import * as fs from 'fs';
import * as path from 'path';
import * as schema from '../../../infrastructure/database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private firebaseApp: App;

  constructor(
    private configService: ConfigService,
    @Inject('DATABASE_CONNECTION')
    private db: NodePgDatabase<typeof schema>,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    const projectId = this.configService.get('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');

    let privateKey = this.configService.get('FIREBASE_PRIVATE_KEY');

    if (!privateKey) {
      const keyPath = path.join(process.cwd(), 'firebase-private-key.pem');
      if (fs.existsSync(keyPath)) {
        privateKey = fs.readFileSync(keyPath, 'utf-8').trim();
        this.logger.log('Loaded Firebase private key from file');
      }
    }

    if (projectId && clientEmail && privateKey) {
      this.firebaseApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      this.logger.log('Firebase Admin initialized');
    } else {
      this.logger.warn('Firebase credentials not configured - push notifications disabled');
    }
  }

  async sendPushToAll(data: {
    title: string;
    body: string;
    icon?: string;
    imageUrl?: string;
    notificationId: string;
  }): Promise<{ total: number; success: number; failed: number }> {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized - skipping push');
      return { total: 0, success: 0, failed: 0 };
    }

    const tokens = await this.db
      .select()
      .from(schema.pushTokens);

    if (tokens.length === 0) {
      return { total: 0, success: 0, failed: 0 };
    }

    const message: MulticastMessage = {
      tokens: tokens.map((t) => t.token),
      notification: {
        title: data.title,
        body: data.body,
      },
      data: {
        notificationId: data.notificationId,
        type: 'notification',
      },
      webpush: data.icon
        ? { fcmOptions: { link: `/notifications` } }
        : undefined,
      android: { priority: 'high' },
    };

    let success = 0;
    let failed = 0;

    try {
      const response = await getMessaging(this.firebaseApp).sendEachForMulticast(message);
      success = response.successCount;
      failed = response.failureCount;

      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx].token);
            this.logger.warn(`Push failed for token: ${resp.error?.message}`);
          }
        });

        if (failedTokens.length > 0) {
          await this.db
            .delete(schema.pushTokens)
            .where(
              eq(schema.pushTokens.token, failedTokens[0]),
            );
        }
      }
    } catch (error) {
      this.logger.error(`Push send error: ${error.message}`);
    }

    return { total: tokens.length, success, failed };
  }
}
