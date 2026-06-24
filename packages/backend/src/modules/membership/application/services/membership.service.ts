import { Injectable, Inject, NotFoundException, ConflictException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, asc } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';
import { NotificationService } from '../../../notifications/application/notification.service';

// Default commission percentages per level (used when plan has no configured rates)
const DEFAULT_COMMISSION_PERCENTAGES: number[] = [10, 5, 3, 2, 1, 0.5, 0.5, 0.5, 0.5, 0.5];

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
export class MembershipService implements OnModuleInit {
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
    this.successUrl = this.configService.get<string>('UDDOKTAPAY_MEMBERSHIP_SUCCESS_URL') || 'http://localhost:3000/membership/payment-success';
    this.cancelUrl = this.configService.get<string>('UDDOKTAPAY_MEMBERSHIP_CANCEL_URL') || 'http://localhost:3000/membership';
    this.webhookUrl = this.configService.get<string>('UDDOKTAPAY_MEMBERSHIP_WEBHOOK_URL') || 'http://localhost:4080/membership/payment-webhook';
  }

  async onModuleInit() {
    await this.seedPlans();
  }

  /**
   * Get all membership plans
   */
  async getPlans() {
    const plans = await this.db
      .select()
      .from(schema.membershipPlans)
      .orderBy(asc(schema.membershipPlans.level));
    return plans;
  }

  /**
   * Get a user's current membership info
   */
  async getUserMembership(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) throw new NotFoundException('User not found');

    const plans = await this.getPlans();
    const currentPlan = plans.find(p => p.name === user.memberStatus) || null;

    // Get commission history
    const commissions = await this.db
      .select()
      .from(schema.commissions)
      .where(eq(schema.commissions.toUserId, userId))
      .orderBy(desc(schema.commissions.createdAt))
      .limit(50);

    const totalEarned = commissions.reduce((sum, c) => sum + Number(c.amount), 0);

    // Get purchase history
    const purchases = await this.db
      .select()
      .from(schema.membershipPurchases)
      .where(eq(schema.membershipPurchases.userId, userId))
      .orderBy(desc(schema.membershipPurchases.createdAt))
      .limit(20);

    return {
      currentPlan: currentPlan ? {
        id: currentPlan.id,
        name: currentPlan.name,
        price: Number(currentPlan.price),
        description: currentPlan.description,
        level: currentPlan.level,
        features: currentPlan.features || [],
        buttonText: currentPlan.buttonText,
        isPopular: currentPlan.isPopular,
        sortOrder: currentPlan.sortOrder,
        colorTheme: currentPlan.colorTheme,
        commissionRates: currentPlan.commissionRates || [],
        isActive: currentPlan.isActive,
      } : null,
      plans: plans.map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        description: p.description,
        level: p.level,
        features: p.features || [],
        buttonText: p.buttonText,
        isPopular: p.isPopular,
        sortOrder: p.sortOrder,
        colorTheme: p.colorTheme,
        commissionRates: p.commissionRates || [],
        isActive: p.isActive,
      })),
      isVerified: user.isVerified,
      purchaseHistory: purchases,
      commissionEarned: totalEarned,
      commissionHistory: commissions.slice(0, 20).map(c => ({
        id: c.id,
        amount: Number(c.amount),
        level: c.level,
        percentage: Number(c.percentage),
        fromUserId: c.fromUserId,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Create a UddoktaPay payment session for membership purchase
   */
  async createMembershipPayment(userId: string, planId: string): Promise<{ paymentUrl: string; invoiceId: string }> {
    const plan = await this.db.query.membershipPlans.findFirst({
      where: eq(schema.membershipPlans.id, planId),
    });
    if (!plan) throw new NotFoundException('Membership plan not found');

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) throw new NotFoundException('User not found');

    // Check if user already has this or higher membership
    const planLevel = plan.level;
    const currentLevel = this.getMemberLevel(user.memberStatus);
    if (planLevel <= currentLevel) {
      throw new ConflictException('You already have this or a higher membership');
    }

    const userInfo = await this.db.query.userInfo.findFirst({
      where: eq(schema.userInfo.userId, userId),
    });

    const fullName = userInfo?.fullName || user.username;
    const email = userInfo?.email || `${user.username}@dreamy-life.com`;
    const amount = Number(plan.price);

    if (amount <= 0) {
      throw new BadRequestException('Plan price must be greater than 0');
    }

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
          plan_id: planId,
          plan_name: plan.name,
          purpose: 'membership_purchase',
        },
        redirect_url: this.successUrl,
        return_type: 'POST',
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

  /**
   * Handle successful payment callback from UddoktaPay
   */
  async handleMembershipPaymentSuccess(invoiceId: string): Promise<{ success: boolean; message: string; newStatus?: string }> {
    const existing = await this.db.query.membershipPayments.findFirst({
      where: eq(schema.membershipPayments.invoiceId, invoiceId),
    });

    if (existing && existing.status === 'completed') {
      return { success: true, message: 'Payment already processed' };
    }

    let verification: UddoktaPayVerifyResponse;
    try {
      verification = await this.verifyPayment(invoiceId);
    } catch (err: any) {
      console.error(`[Membership] Verification failed for invoice ${invoiceId}:`, err?.message || err);
      return { success: false, message: err?.message || 'Payment verification failed' };
    }

    if (verification.status !== 'COMPLETED') {
      if (existing) {
        await this.db
          .update(schema.membershipPayments)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(eq(schema.membershipPayments.invoiceId, invoiceId));
      }
      return { success: false, message: `Payment status: ${verification.status}` };
    }

    const amount = parseFloat(verification.amount);
    const fee = parseFloat(verification.fee || '0');
    const chargedAmount = parseFloat(verification.charged_amount);
    const userId = verification.metadata?.user_id as string;
    const planId = verification.metadata?.plan_id as string;
    const planName = verification.metadata?.plan_name as string;

    if (!userId || !planId) {
      return { success: false, message: 'Missing user_id or plan_id in payment metadata' };
    }

    const plan = await this.db.query.membershipPlans.findFirst({
      where: eq(schema.membershipPlans.id, planId),
    });
    if (!plan) {
      return { success: false, message: 'Membership plan not found' };
    }

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Save payment record
    if (existing) {
      await this.db
        .update(schema.membershipPayments)
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
        .where(eq(schema.membershipPayments.invoiceId, invoiceId));
    } else {
      await this.db.insert(schema.membershipPayments).values({
        userId,
        planId,
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

    // Check if user already has this or higher membership (double-check)
    const currentLevel = this.getMemberLevel(user.memberStatus);
    if (plan.level <= currentLevel) {
      return { success: true, message: 'User already has this or higher membership' };
    }

    // Create purchase record
    const [purchase] = await this.db
      .insert(schema.membershipPurchases)
      .values({
        userId,
        planId: plan.id,
        amount: plan.price,
        status: 'completed',
      })
      .returning();

    // Update user's member status AND mark as verified
    await this.db
      .update(schema.users)
      .set({ memberStatus: plan.name as any, isVerified: true, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    // Distribute commissions to upline (10 levels)
    await this.distributeCommissions(userId, plan, purchase.id);

    // Send notifications
    await this.sendMembershipNotifications(userId, plan.name, amount);

    return { success: true, message: 'Membership purchased successfully', newStatus: plan.name };
  }

  /**
   * Handle payment cancel callback from UddoktaPay
   */
  async handleMembershipPaymentCancel(invoiceId: string): Promise<{ success: boolean }> {
    const existing = await this.db.query.membershipPayments.findFirst({
      where: eq(schema.membershipPayments.invoiceId, invoiceId),
    });

    if (existing) {
      await this.db
        .update(schema.membershipPayments)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(schema.membershipPayments.invoiceId, invoiceId));
    }

    return { success: true };
  }

  /**
   * Verify payment with UddoktaPay API
   */
  async verifyPayment(invoiceId: string): Promise<UddoktaPayVerifyResponse> {
    const url = `${this.baseUrl}/api/verify-payment`;
    console.log(`[Membership] Verifying invoice ${invoiceId} at ${url}`);

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
    console.log(`[Membership] Verify response for ${invoiceId}:`, JSON.stringify(data));

    if (data.status === 'ERROR') {
      throw new BadRequestException(data.message || 'Payment verification failed');
    }

    return data as UddoktaPayVerifyResponse;
  }

  /**
   * Distribute commissions to upline users (up to 10 levels)
   */
  private async distributeCommissions(
    buyerId: string,
    plan: typeof schema.membershipPlans.$inferSelect,
    purchaseId: string,
  ) {
    const buyer = await this.db.query.users.findFirst({
      where: eq(schema.users.id, buyerId),
    });
    if (!buyer || !buyer.referredBy) return [];

    // Get buyer's display name for the notification
    const buyerName = buyer.username || 'A user';

    // Use admin-configured commission rates from the plan, fallback to defaults
    const planRates = (plan.commissionRates as number[]) || [];
    const percentages = planRates.length > 0 ? planRates : DEFAULT_COMMISSION_PERCENTAGES;
    const commissions: any[] = [];

    let currentReferCode: string | null = buyer.referredBy;
    let level = 1;

    while (currentReferCode && level <= 10) {
      const uplineUser = await this.db.query.users.findFirst({
        where: eq(schema.users.ownRefercode, currentReferCode),
      });
      if (!uplineUser) break;

      const percentage = percentages[level - 1];
      if (percentage > 0) {
        const amount = (Number(plan.price) * percentage) / 100;

        const [commission] = await this.db
          .insert(schema.commissions)
          .values({
            fromUserId: buyerId,
            toUserId: uplineUser.id,
            purchaseId,
            level,
            amount: String(amount),
            percentage: String(percentage),
          })
          .returning();

        commissions.push({
          id: commission.id,
          fromUserId: buyerId,
          toUserId: uplineUser.id,
          level,
          amount: Number(commission.amount),
          percentage: Number(commission.percentage),
        });

        // Send notification to the upline user about earned commission
        try {
          const uplineName = uplineUser.info && typeof uplineUser.info === 'object'
            ? (uplineUser.info as any).name || uplineUser.username
            : uplineUser.username;

          await this.notificationService.sendToUser(uplineUser.id, {
            title: 'Commission Earned!',
            body: `You earned ৳${amount.toFixed(2)} (${percentage}%) from ${buyerName}'s "${plan.name}" membership purchase. Level ${level} referral commission.`,
            icon: 'payments',
            createdBy: buyerId,
          });
        } catch (err) {
          console.error(`Failed to send commission notification to ${uplineUser.id}:`, err);
        }
      }

      currentReferCode = uplineUser.referredBy || null;
      level++;
    }

    return commissions;
  }

  private async sendMembershipNotifications(userId: string, planName: string, amount: number) {
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });
      const username = user?.username || 'Unknown';

      // Notify user
      await this.notificationService.sendToUser(userId, {
        title: 'Membership Purchased!',
        body: `Congratulations! You've been upgraded to "${planName}" membership. Your account is now verified.`,
        icon: 'workspace_premium',
        createdBy: userId,
      });

      // Notify admins
      const admins = await this.db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.memberStatus, 'super_admin'));

      if (admins.length > 0) {
        const adminNotification = await this.notificationService.create({
          title: 'New Membership Purchase',
          body: `User ${username} purchased "${planName}" membership for ৳${amount.toFixed(2)}.`,
          icon: 'workspace_premium',
          type: 'targeted',
          createdBy: userId,
        });
        await this.notificationService.broadcast(adminNotification.id);
      }
    } catch (err) {
      console.error('Failed to send membership notifications:', err);
    }
  }

  private getMemberLevel(status: string): number {
    const levels: Record<string, number> = {
      super_admin: 5,
      vvip: 4,
      smart: 3,
      standard: 2,
      basic: 1,
      user: 0,
    };
    return levels[status] ?? 0;
  }

  /**
   * Seed default membership plans on startup
   */
  async seedPlans() {
    const existing = await this.db.select().from(schema.membershipPlans);
    if (existing.length > 0) return;

    const plans = [
      {
        name: 'user',
        price: '0',
        description: 'Free member with basic access',
        level: 0,
        features: [{ text: 'Basic Access', icon: 'person' }, { text: 'Community Feed', icon: 'forum' }, { text: '1x Reward Points', icon: 'paid' }],
        buttonText: 'Current Plan',
        isPopular: false,
        sortOrder: 0,
        colorTheme: 'primary',
        isActive: true,
      },
      {
        name: 'basic',
        price: '500',
        description: 'Basic membership with starter benefits',
        level: 1,
        features: [{ text: 'Standard Support', icon: 'headset_mic' }, { text: 'Member Newsletter', icon: 'mail' }, { text: '1x Reward Points', icon: 'paid' }],
        buttonText: 'Choose Basic',
        isPopular: false,
        sortOrder: 1,
        colorTheme: 'primary',
        commissionRates: [10, 5, 3, 2, 1, 0.5, 0.5, 0.5, 0.5, 0.5],
        isActive: true,
      },
      {
        name: 'standard',
        price: '1500',
        description: 'Standard membership with enhanced benefits',
        level: 2,
        features: [{ text: 'Priority Support', icon: 'support_agent' }, { text: 'Early Access to Sales', icon: 'schedule' }, { text: '2x Reward Points', icon: 'paid' }, { text: 'Exclusive Content', icon: 'star' }],
        buttonText: 'Choose Standard',
        isPopular: true,
        sortOrder: 2,
        colorTheme: 'tertiary',
        commissionRates: [12, 6, 4, 3, 2, 1, 1, 0.5, 0.5, 0.5],
        isActive: true,
      },
      {
        name: 'smart',
        price: '3500',
        description: 'Smart membership with premium benefits',
        level: 3,
        features: [{ text: '24/7 VIP Support', icon: 'headset_mic' }, { text: 'Invite-Only Events', icon: 'celebration' }, { text: '3x Reward Points', icon: 'paid' }, { text: 'Free Shipping', icon: 'local_shipping' }],
        buttonText: 'Choose Smart',
        isPopular: false,
        sortOrder: 3,
        colorTheme: 'secondary',
        commissionRates: [15, 8, 5, 3, 2, 1.5, 1, 0.5, 0.5, 0.5],
        isActive: true,
      },
      {
        name: 'vvip',
        price: '10000',
        description: 'VVIP membership with exclusive benefits',
        level: 4,
        features: [{ text: '24/7 VIP Concierge', icon: 'concierge' }, { text: 'Invite-Only Events', icon: 'celebration' }, { text: '4x Reward Points', icon: 'paid' }, { text: 'Complimentary Shipping', icon: 'local_shipping' }, { text: 'Personal Account Manager', icon: 'badge' }],
        buttonText: 'Choose VVIP',
        isPopular: false,
        sortOrder: 4,
        colorTheme: 'secondary',
        commissionRates: [20, 10, 6, 4, 3, 2, 1.5, 1, 1, 0.5],
        isActive: true,
      },
    ];

    for (const plan of plans) {
      await this.db.insert(schema.membershipPlans).values(plan);
    }
    console.log('Membership plans seeded successfully');
  }
}
