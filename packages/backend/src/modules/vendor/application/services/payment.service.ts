import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';

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
export class PaymentService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly successUrl: string;
  private readonly cancelUrl: string;
  private readonly webhookUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {
    this.baseUrl = this.configService.get<string>('UDDOKTAPAY_BASE_URL') || 'https://sandbox.uddoktapay.com';
    this.apiKey = this.configService.get<string>('UDDOKTAPAY_API_KEY') || '';
    this.successUrl = this.configService.get<string>('UDDOKTAPAY_SUCCESS_URL') || 'http://localhost:3000/vendor/payment-success';
    this.cancelUrl = this.configService.get<string>('UDDOKTAPAY_CANCEL_URL') || 'http://localhost:3000/vendor/apply';
    this.webhookUrl = this.configService.get<string>('UDDOKTAPAY_WEBHOOK_URL') || 'http://localhost:4000/vendor/payment-webhook';
  }

  async createVendorPayment(userId: string, email: string, fullName: string): Promise<{ paymentUrl: string; invoiceId: string }> {
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
        amount: '700',
        metadata: {
          user_id: userId,
          purpose: 'vendor_creation',
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

    return {
      paymentUrl: data.payment_url,
      invoiceId: data.payment_url.split('/').pop() || '',
    };
  }

  async verifyPayment(invoiceId: string): Promise<UddoktaPayVerifyResponse> {
    const response = await fetch(`${this.baseUrl}/api/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'RT-UDDOKTAPAY-API-KEY': this.apiKey,
      },
      body: JSON.stringify({ invoice_id: invoiceId }),
    });

    const data = await response.json();

    if (data.status === 'ERROR') {
      throw new BadRequestException(data.message || 'Payment verification failed');
    }

    return data as UddoktaPayVerifyResponse;
  }

  async savePaymentRecord(userId: string, invoiceId: string, amount: number, fee: number, chargedAmount: number, paymentMethod: string, senderNumber: string, transactionId: string, metadata: Record<string, unknown>, status: string) {
    const existing = await this.db.query.vendorPayments.findFirst({
      where: eq(schema.vendorPayments.invoiceId, invoiceId),
    });

    if (existing) {
      await this.db
        .update(schema.vendorPayments)
        .set({ status, paymentMethod, senderNumber, transactionId, updatedAt: new Date() })
        .where(eq(schema.vendorPayments.invoiceId, invoiceId));
      return existing;
    }

    const [record] = await this.db
      .insert(schema.vendorPayments)
      .values({
        userId,
        invoiceId,
        amount: String(amount),
        fee: String(fee),
        chargedAmount: String(chargedAmount),
        paymentMethod,
        senderNumber,
        transactionId,
        metadata,
        status,
      })
      .returning();

    return record;
  }
}
