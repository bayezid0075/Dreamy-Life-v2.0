import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, and, gte, count, sum, sql, like, or } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';
import { NotificationService } from '../../../notifications/application/notification.service';

interface UddoktaPayCreateResponse {
  status: boolean;
  message: string;
  payment_url?: string;
}

interface UddoktaPayVerifyResponse {
  full_name: string;
  email: string;
  amount: string;
  fee: string;
  charged_amount: string;
  invoice_id: string;
  metadata: Record<string, unknown>;
  payment_method: string;
  sender_number: string;
  transaction_id: string;
  date: string;
  status: string;
}

@Injectable()
export class FundPaymentService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly successUrl: string;
  private readonly cancelUrl: string;
  private readonly webhookUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
    private readonly notificationService: NotificationService,
  ) {
    this.baseUrl = this.configService.get<string>('UDDOKTAPAY_BASE_URL') || 'https://sandbox.uddoktapay.com';
    this.apiKey = this.configService.get<string>('UDDOKTAPAY_API_KEY') || '';
    this.successUrl = this.configService.get<string>('UDDOKTAPAY_FUND_SUCCESS_URL') || 'http://localhost:3000/wallet/payment-success';
    this.cancelUrl = this.configService.get<string>('UDDOKTAPAY_FUND_CANCEL_URL') || 'http://localhost:3000/wallet';
    this.webhookUrl = this.configService.get<string>('UDDOKTAPAY_FUND_WEBHOOK_URL') || 'http://localhost:4080/wallet/payment-webhook';
  }

  async createFundPayment(userId: string, amount: number, userEmail?: string, userName?: string): Promise<{ paymentUrl: string; invoiceId: string }> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userInfo = await this.db.query.userInfo.findFirst({
      where: eq(schema.userInfo.userId, userId),
    });

    const fullName = userName || userInfo?.fullName || user.username;
    const email = userEmail || userInfo?.email || `${user.username}@dreamy-life.com`;

    const response = await fetch(`${this.baseUrl}/api/checkout-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'RT-UDDOKTAPAY-API-KEY': this.apiKey,
      },
      body: JSON.stringify({
        full_name: fullName,
        email: email,
        amount: String(amount),
        metadata: {
          user_id: userId,
          purpose: 'fund_addition',
        },
        redirect_url: this.successUrl,
        return_type: 'GET',
        cancel_url: this.cancelUrl,
        webhook_url: this.webhookUrl,
      }),
    });

    const data: UddoktaPayCreateResponse = await response.json();

    if (!data.status || !data.payment_url) {
      throw new BadRequestException(data.message || 'Payment creation failed');
    }

    const invoiceId = data.payment_url.split('/').pop() || '';

    return {
      paymentUrl: data.payment_url,
      invoiceId,
    };
  }

  async handlePaymentSuccess(invoiceId: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.db.query.fundPayments.findFirst({
      where: eq(schema.fundPayments.invoiceId, invoiceId),
    });

    if (existing && existing.status === 'completed') {
      return { success: true, message: 'Payment already processed' };
    }

    let verification: UddoktaPayVerifyResponse;
    try {
      verification = await this.verifyPayment(invoiceId);
    } catch (err: any) {
      console.error(`[FundPayment] Verification failed for invoice ${invoiceId}:`, err?.message || err);
      return { success: false, message: err?.message || 'Payment verification failed' };
    }

    if (verification.status !== 'COMPLETED') {
      console.warn(`[FundPayment] Invoice ${invoiceId} status: ${verification.status}`);
      if (existing) {
        await this.db
          .update(schema.fundPayments)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(eq(schema.fundPayments.invoiceId, invoiceId));
      }
      return { success: false, message: `Payment status: ${verification.status}` };
    }

    const amount = parseFloat(verification.amount);
    const fee = parseFloat(verification.fee || '0');
    const chargedAmount = parseFloat(verification.charged_amount);
    const userId = verification.metadata?.user_id as string;

    if (!userId) {
      return { success: false, message: 'Missing user_id in payment metadata' };
    }

    await this.creditFundsBalance(userId, amount);

    if (existing) {
      await this.db
        .update(schema.fundPayments)
        .set({
          status: 'completed',
          fee: String(fee),
          chargedAmount: String(chargedAmount),
          paymentMethod: verification.payment_method,
          senderNumber: verification.sender_number,
          transactionId: verification.transaction_id,
          metadata: verification.metadata,
          updatedAt: new Date(),
        })
        .where(eq(schema.fundPayments.invoiceId, invoiceId));
    } else {
      await this.db.insert(schema.fundPayments).values({
        userId,
        invoiceId,
        amount: String(amount),
        fee: String(fee),
        chargedAmount: String(chargedAmount),
        paymentMethod: verification.payment_method,
        senderNumber: verification.sender_number,
        transactionId: verification.transaction_id,
        metadata: verification.metadata,
        status: 'completed',
      });
    }

    await this.sendPaymentNotifications(userId, amount);

    return { success: true, message: 'Payment processed successfully' };
  }

  private async creditFundsBalance(userId: string, amount: number) {
    let wallet = await this.db.query.wallets.findFirst({
      where: eq(schema.wallets.userId, userId),
    });

    if (!wallet) {
      const [created] = await this.db
        .insert(schema.wallets)
        .values({ userId })
        .returning();
      wallet = created;
    }

    const newBalance = Number(wallet.fundsBalance) + amount;

    await this.db
      .update(schema.wallets)
      .set({ fundsBalance: String(newBalance), updatedAt: new Date() })
      .where(eq(schema.wallets.userId, userId));

    await this.db.insert(schema.transactions).values({
      userId,
      type: 'fund_credit',
      amount: String(amount),
      description: `Added ৳${amount.toFixed(2)} via UddoktaPay`,
    });
  }

  private async sendPaymentNotifications(userId: string, amount: number) {
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });

      const username = user?.username || 'Unknown';

      const admins = await this.db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.memberStatus, 'super_admin'));

      const userNotification = await this.notificationService.create({
        title: 'Fund Addition Successful',
        body: `৳${amount.toFixed(2)} has been added to your funds balance.`,
        icon: 'payments',
        type: 'targeted',
        category: 'app',
        createdBy: userId,
      });

      await this.notificationService.broadcast(userNotification.id);

      if (admins.length > 0) {
        const adminNotification = await this.notificationService.create({
          title: 'New Fund Addition',
          body: `User ${username} added ৳${amount.toFixed(2)} to their funds.`,
          icon: 'account_balance',
          type: 'targeted',
          category: 'app',
          createdBy: userId,
        });

        await this.notificationService.broadcast(adminNotification.id);
      }
    } catch (err) {
      console.error('Failed to send payment notifications:', err);
    }
  }

  async verifyPayment(invoiceId: string): Promise<UddoktaPayVerifyResponse> {
    const url = `${this.baseUrl}/api/verify-payment`;
    console.log(`[FundPayment] Verifying invoice ${invoiceId} at ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'RT-UDDOKTAPAY-API-KEY': this.apiKey,
      },
      body: JSON.stringify({ invoice_id: invoiceId }),
    });

    const data = await response.json();
    console.log(`[FundPayment] Verify response for ${invoiceId}:`, JSON.stringify(data));

    if (data.status === 'ERROR') {
      throw new BadRequestException(data.message || 'Payment verification failed');
    }

    return data as UddoktaPayVerifyResponse;
  }

  async handlePaymentCancel(invoiceId: string): Promise<{ success: boolean }> {
    const existing = await this.db.query.fundPayments.findFirst({
      where: eq(schema.fundPayments.invoiceId, invoiceId),
    });

    if (existing) {
      await this.db
        .update(schema.fundPayments)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(schema.fundPayments.invoiceId, invoiceId));
    }

    return { success: true };
  }

  async getFundPayments(page = 1, limit = 20, filter?: string, search?: string) {
    const offset = (page - 1) * limit;
    const conditions: any[] = [];

    if (filter && filter !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (filter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      conditions.push(gte(schema.fundPayments.createdAt, startDate));
    }

    if (search) {
      conditions.push(
        or(
          like(schema.fundPayments.invoiceId, `%${search}%`),
          like(schema.fundPayments.paymentMethod, `%${search}%`),
          like(schema.fundPayments.senderNumber, `%${search}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await this.db
      .select({
        id: schema.fundPayments.id,
        userId: schema.fundPayments.userId,
        invoiceId: schema.fundPayments.invoiceId,
        amount: schema.fundPayments.amount,
        fee: schema.fundPayments.fee,
        chargedAmount: schema.fundPayments.chargedAmount,
        paymentMethod: schema.fundPayments.paymentMethod,
        senderNumber: schema.fundPayments.senderNumber,
        transactionId: schema.fundPayments.transactionId,
        status: schema.fundPayments.status,
        createdAt: schema.fundPayments.createdAt,
        updatedAt: schema.fundPayments.updatedAt,
        username: schema.users.username,
      })
      .from(schema.fundPayments)
      .innerJoin(schema.users, eq(schema.fundPayments.userId, schema.users.id))
      .where(whereClause)
      .orderBy(desc(schema.fundPayments.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await this.db
      .select({ count: count() })
      .from(schema.fundPayments)
      .where(whereClause);

    return {
      payments: items.map(item => ({
        ...item,
        amount: Number(item.amount),
        fee: Number(item.fee || 0),
        chargedAmount: Number(item.chargedAmount),
      })),
      total: Number(totalResult[0]?.count || 0),
      page,
      limit,
      totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / limit),
    };
  }

  async getFundStats() {
    const totalResult = await this.db
      .select({ total: sum(schema.fundPayments.amount) })
      .from(schema.fundPayments)
      .where(eq(schema.fundPayments.status, 'completed'));

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayResult = await this.db
      .select({ total: sum(schema.fundPayments.amount) })
      .from(schema.fundPayments)
      .where(
        and(
          eq(schema.fundPayments.status, 'completed'),
          gte(schema.fundPayments.createdAt, todayStart),
        ),
      );

    const uniquePayersResult = await this.db
      .select({ count: count() })
      .from(sql`(SELECT DISTINCT "user_id" FROM "fund_payments" WHERE "status" = 'completed') AS unique_payers`);

    const recentPayments = await this.db
      .select({
        id: schema.fundPayments.id,
        userId: schema.fundPayments.userId,
        amount: schema.fundPayments.amount,
        status: schema.fundPayments.status,
        paymentMethod: schema.fundPayments.paymentMethod,
        createdAt: schema.fundPayments.createdAt,
        username: schema.users.username,
      })
      .from(schema.fundPayments)
      .innerJoin(schema.users, eq(schema.fundPayments.userId, schema.users.id))
      .orderBy(desc(schema.fundPayments.createdAt))
      .limit(5);

    return {
      totalCollected: Number(totalResult[0]?.total || 0),
      todayCollected: Number(todayResult[0]?.total || 0),
      uniquePayers: Number(uniquePayersResult[0]?.count || 0),
      recentPayments: recentPayments.map(p => ({
        ...p,
        amount: Number(p.amount),
      })),
    };
  }
}
