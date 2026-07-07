import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc } from 'drizzle-orm';
import { ConfigService } from '@nestjs/config';
import * as schema from '../../../../infrastructure/database/schema';
import { WalletService } from '../../../wallet/application/services/wallet.service';

const OPERATOR_MAP: Record<string, { operator: string; defaultNumberType: number }> = {
  GP: { operator: '7', defaultNumberType: 1 },
  AL: { operator: '6', defaultNumberType: 1 },
  AT: { operator: '6', defaultNumberType: 1 },
  BL: { operator: '9', defaultNumberType: 1 },
  RB: { operator: '8', defaultNumberType: 1 },
  TT: { operator: '5', defaultNumberType: 1 },
  ST: { operator: '4', defaultNumberType: 3 },
};

@Injectable()
export class RechargeService {
  private readonly logger = new Logger(RechargeService.name);

  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
    private readonly config: ConfigService,
    private readonly walletService: WalletService,
  ) {}

  private maskSecret(value: string): string {
    if (!value || value.length < 6) return '****';
    return value.substring(0, 3) + '****' + value.substring(value.length - 3);
  }

  private getResolvedConfig(config: any) {
    return {
      ...config,
      apiKey: config.apiKey || this.config.get('RECHARGE_ACCESS_ID') || '',
      apiSecret: config.apiSecret || this.config.get('RECHARGE_ACCESS_PASS') || '',
      apiBaseUrl: config.apiBaseUrl || this.config.get('RECHARGE_API_BASE_URL') || 'http://118.179.129.98/myportal/api/rechargeapi',
    };
  }

  async getConfig() {
    this.logger.debug('Loading recharge config from database');
    const config = await this.db.query.rechargeConfig.findFirst();
    if (!config) {
      this.logger.log('No config found, creating default config');
      const [created] = await this.db
        .insert(schema.rechargeConfig)
        .values({})
        .returning();
      return created;
    }
    this.logger.debug(`Config loaded: apiKey=${this.maskSecret(config.apiKey)}, baseUrl=${config.apiBaseUrl}, isActive=${config.isActive}`);
    return config;
  }

  async updateConfig(data: {
    apiKey?: string;
    apiSecret?: string;
    apiBaseUrl?: string;
    userCommissionRate?: string;
    commissionRates?: number[];
    isActive?: boolean;
  }) {
    this.logger.log(`Updating recharge config: keys=[${Object.keys(data).join(', ')}]`);
    if (data.apiKey !== undefined) {
      this.logger.debug(`  access_id set to: ${this.maskSecret(data.apiKey)}`);
    }
    if (data.apiSecret !== undefined) {
      this.logger.debug(`  access_pass set to: ${this.maskSecret(data.apiSecret)}`);
    }
    const existing = await this.getConfig();
    const [updated] = await this.db
      .update(schema.rechargeConfig)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.rechargeConfig.id, existing.id))
      .returning();
    this.logger.log('Recharge config updated successfully');
    return updated;
  }

  async createRecharge(userId: string, data: {
    phoneNumber: string;
    operator: string;
    connectionType: string;
    amount: number;
  }) {
    this.logger.log(`Creating recharge: user=${userId} phone=${data.phoneNumber} operator=${data.operator} amount=${data.amount} type=${data.connectionType}`);

    const dbConfig = await this.getConfig();
    if (!dbConfig.isActive) {
      this.logger.warn('Recharge service is currently disabled');
      throw new BadRequestException('Mobile recharge service is currently disabled');
    }

    const config = this.getResolvedConfig(dbConfig);
    this.logger.debug(`Resolved config: apiKey=${this.maskSecret(config.apiKey)}, baseUrl=${config.apiBaseUrl}`);

    const operatorKey = data.operator.toUpperCase();
    const operatorInfo = OPERATOR_MAP[operatorKey];
    if (!operatorInfo) {
      this.logger.warn(`Invalid operator: ${data.operator}. Valid operators: ${Object.keys(OPERATOR_MAP).join(', ')}`);
      throw new BadRequestException(`Invalid operator: ${data.operator}`);
    }

    if (data.amount < 20 || data.amount > 25000) {
      this.logger.warn(`Amount out of range: ${data.amount}. Must be between 20 and 25000`);
      throw new BadRequestException('Amount must be between ৳20 and ৳25,000');
    }

    const fundsBalance = await this.walletService.getFundsBalance(userId);
    if (fundsBalance < data.amount) {
      this.logger.warn(`Insufficient funds: user=${userId} balance=${fundsBalance} required=${data.amount}`);
      throw new BadRequestException('Insufficient funds. Please add funds to your wallet first.');
    }

    this.logger.debug(`Funds balance: ${fundsBalance}, deducting ${data.amount}`);
    await this.walletService.debitFunds(userId, data.amount, `Mobile recharge ${data.phoneNumber} (${operatorKey})`);

    const apiTrxId = `DL${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    this.logger.debug(`Generated apiTrxId: ${apiTrxId}`);

    const [order] = await this.db
      .insert(schema.rechargeOrders)
      .values({
        userId,
        phoneNumber: data.phoneNumber,
        operator: operatorKey,
        connectionType: data.connectionType || 'prepaid',
        amount: String(data.amount),
        status: 'pending',
        apiTransactionId: apiTrxId,
      })
      .returning();

    this.logger.log(`Order created: orderId=${order.id} refid=${apiTrxId}`);

    try {
      const numberType = data.connectionType === 'postpaid' ? 2 : operatorInfo.defaultNumberType;

      this.logger.log(`Calling recharge API: operator=${operatorInfo.operator} number=${data.phoneNumber} amount=${data.amount} refid=${apiTrxId}`);
      const startTime = Date.now();

      const result = await this.callRechargeApi(config, {
        number: data.phoneNumber,
        operatorCode: operatorInfo.operator,
        numberType,
        amount: data.amount,
        trxid: apiTrxId,
      });

      const elapsed = Date.now() - startTime;
      this.logger.log(`API response received in ${elapsed}ms: STATUS=${result.data?.STATUS} RECHARGE_STATUS=${result.data?.RECHARGE_STATUS} TRXID=${result.data?.TRXID} MESSAGE=${result.data?.MESSAGE}`);

      if (result.success) {
        this.logger.log(`Recharge SUCCESS: orderId=${order.id} refid=${apiTrxId} apiTrxId=${result.data?.TRXID}`);

        await this.db
          .update(schema.rechargeOrders)
          .set({
            status: 'success',
            apiResponse: JSON.stringify(result.data),
            updatedAt: new Date(),
          })
          .where(eq(schema.rechargeOrders.id, order.id));

        this.logger.debug(`Distributing commissions for order ${order.id}`);
        await this.distributeCommissions(order.id, userId, data.amount);
      } else {
        this.logger.warn(`Recharge FAILED: orderId=${order.id} refid=${apiTrxId} status=${result.data?.STATUS} rechargeStatus=${result.data?.RECHARGE_STATUS} message=${result.data?.MESSAGE}`);

        await this.db
          .update(schema.rechargeOrders)
          .set({
            status: 'failed',
            apiResponse: JSON.stringify(result.data),
            updatedAt: new Date(),
          })
          .where(eq(schema.rechargeOrders.id, order.id));

        this.logger.log(`Initiating refund for failed recharge: user=${userId} amount=${data.amount}`);
        await this.refundUser(userId, data.amount, data.phoneNumber);
      }
    } catch (error) {
      this.logger.error(`Recharge API call error: orderId=${order.id} error=${error.message}`, error.stack);

      await this.db
        .update(schema.rechargeOrders)
        .set({
          status: 'failed',
          apiResponse: JSON.stringify({ error: error.message }),
          updatedAt: new Date(),
        })
        .where(eq(schema.rechargeOrders.id, order.id));

      this.logger.log(`Initiating refund for errored recharge: user=${userId} amount=${data.amount}`);
      await this.refundUser(userId, data.amount, data.phoneNumber);
    }

    return this.getOrder(order.id);
  }

  private async callRechargeApi(
    config: any,
    data: { number: string; operatorCode: string; numberType: number; amount: number; trxid: string },
  ) {
    const baseUrl = config.apiBaseUrl;

    const params = new URLSearchParams({
      access_id: config.apiKey,
      access_pass: config.apiSecret,
      service: 'MRC',
      operator: data.operatorCode,
      number_type: String(data.numberType),
      number: data.number,
      amount: String(data.amount),
      refid: data.trxid,
    });

    const fullUrl = `${baseUrl}/recharge_api_thirdparty.php?${params.toString()}`;
    const maskedUrl = fullUrl.replace(/access_pass=[^&]+/, `access_pass=****`);
    this.logger.debug(`API request URL: ${maskedUrl}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(fullUrl, { signal: controller.signal });
      clearTimeout(timeout);

      this.logger.debug(`API HTTP status: ${response.status} ${response.statusText}`);

      const rawText = await response.text();
      this.logger.debug(`API raw response: ${rawText}`);

      let result: any;
      try {
        result = JSON.parse(rawText);
      } catch (parseError) {
        this.logger.error(`API response is not valid JSON: ${rawText.substring(0, 200)}`);
        return {
          success: false,
          data: { STATUS: 'FAILED', MESSAGE: 'Invalid JSON response from API', rawResponse: rawText },
        };
      }

      this.logger.debug(`Parsed response: STATUS=${result.STATUS} RECHARGE_STATUS=${result.RECHARGE_STATUS} TRXID=${result.TRXID} MESSAGE=${result.MESSAGE}`);

      return {
        success: response.ok && result.STATUS === 'OK',
        data: result,
      };
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        this.logger.error(`API request timed out after 30s for refid=${data.trxid}`);
        return {
          success: false,
          data: { STATUS: 'FAILED', MESSAGE: 'API request timed out (30s)' },
        };
      }
      throw error;
    }
  }

  private async refundUser(userId: string, amount: number, phoneNumber: string) {
    this.logger.log(`Refunding user=${userId} amount=${amount} phone=${phoneNumber}`);

    await this.walletService.creditFunds(userId, amount, `Refund: failed mobile recharge ${phoneNumber}`);

    this.logger.debug(`Refund complete for user=${userId}`);
  }

  private getCommissionPercentages(commissionRates: any, rechargeAmount: number): number[] {
    const defaultRates = [2, 1, 0.5, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1];

    if (!commissionRates || !Array.isArray(commissionRates) || commissionRates.length === 0) {
      return defaultRates;
    }

    const first = commissionRates[0];

    if (typeof first === 'number') {
      return commissionRates as number[];
    }

    if (typeof first === 'object' && first !== null && 'rates' in first) {
      const tiers = commissionRates as Array<{ minAmount: number; maxAmount: number; rates: number[] }>;
      const match = tiers.find(
        (t) => rechargeAmount >= t.minAmount && rechargeAmount <= t.maxAmount,
      );
      return match ? match.rates : tiers[tiers.length - 1]?.rates || defaultRates;
    }

    return defaultRates;
  }

  private async distributeCommissions(orderId: string, buyerId: string, rechargeAmount: number) {
    this.logger.debug(`Distributing commissions: orderId=${orderId} buyer=${buyerId} amount=${rechargeAmount}`);

    const buyer = await this.db.query.users.findFirst({
      where: eq(schema.users.id, buyerId),
    });
    if (!buyer || !buyer.referredBy) {
      this.logger.debug('No referrer found, skipping commission distribution');
      return [];
    }

    const config = await this.getConfig();
    const userCommissionRate = Number(config.userCommissionRate) || 2;

    const userCommission = (rechargeAmount * userCommissionRate) / 100;

    await this.walletService.creditWallet(buyerId, userCommission, `Recharge commission (${userCommissionRate}%)`);

    await this.db
      .update(schema.rechargeOrders)
      .set({ userCommission: String(userCommission) })
      .where(eq(schema.rechargeOrders.id, orderId));

    this.logger.debug(`User commission: ${userCommission} (${userCommissionRate}%) credited to ${buyerId}`);

    const percentages = this.getCommissionPercentages(config.commissionRates, rechargeAmount);
    this.logger.debug(`Using commission tier for amount ${rechargeAmount}: ${percentages.join(', ')}`);
    const commissions: any[] = [];

    let currentReferCode: string | null = buyer.referredBy;
    let level = 1;

    while (currentReferCode && level <= 10) {
      const uplineUser = await this.db.query.users.findFirst({
        where: eq(schema.users.ownRefercode, currentReferCode),
      });
      if (!uplineUser) break;

      const percentage = percentages[level - 1] || 0;
      if (percentage > 0) {
        const amount = (rechargeAmount * percentage) / 100;

        await this.db.insert(schema.rechargeCommissions).values({
          rechargeOrderId: orderId,
          fromUserId: buyerId,
          toUserId: uplineUser.id,
          level,
          amount: String(amount),
          percentage: String(percentage),
        });

        await this.walletService.creditWallet(uplineUser.id, amount, `Level ${level} recharge commission from ${buyer.username}`);

        this.logger.debug(`Level ${level} commission: ${amount} (${percentage}%) -> upline ${uplineUser.id}`);
        commissions.push({ level, amount, percentage, toUserId: uplineUser.id });
      }

      currentReferCode = uplineUser.referredBy || null;
      level++;
    }

    this.logger.log(`Commission distribution complete: ${commissions.length} levels paid out`);
    return commissions;
  }

  async getOrder(orderId: string) {
    this.logger.debug(`Fetching order: ${orderId}`);
    const order = await this.db.query.rechargeOrders.findFirst({
      where: eq(schema.rechargeOrders.id, orderId),
    });
    if (!order) {
      this.logger.warn(`Order not found: ${orderId}`);
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async getUserOrders(userId: string, page: number = 1, limit: number = 20) {
    this.logger.debug(`Fetching orders for user=${userId} page=${page} limit=${limit}`);
    const offset = (page - 1) * limit;
    const orders = await this.db
      .select()
      .from(schema.rechargeOrders)
      .where(eq(schema.rechargeOrders.userId, userId))
      .orderBy(desc(schema.rechargeOrders.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      orders,
      total: orders.length,
      page,
      limit,
    };
  }

  async getAllOrders(page: number = 1, limit: number = 20, status?: string) {
    this.logger.debug(`Fetching all orders: page=${page} limit=${limit} status=${status || 'all'}`);
    const offset = (page - 1) * limit;
    const conditions = status ? eq(schema.rechargeOrders.status, status) : undefined;

    const orders = await this.db
      .select()
      .from(schema.rechargeOrders)
      .where(conditions)
      .orderBy(desc(schema.rechargeOrders.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      orders,
      total: orders.length,
      page,
      limit,
    };
  }

  async getBalance() {
    this.logger.log('Checking API provider balance');
    const dbConfig = await this.getConfig();
    const config = this.getResolvedConfig(dbConfig);

    const params = new URLSearchParams({
      access_id: config.apiKey,
      access_pass: config.apiSecret,
      service: 'BLCK',
    });

    const fullUrl = `${config.apiBaseUrl}/recharge_api_thirdparty.php?${params.toString()}`;
    const maskedUrl = fullUrl.replace(/access_pass=[^&]+/, 'access_pass=****');
    this.logger.debug(`Balance check URL: ${maskedUrl}`);

    try {
      const response = await fetch(fullUrl);
      this.logger.debug(`Balance check HTTP status: ${response.status}`);

      const rawText = await response.text();
      this.logger.debug(`Balance check raw response: ${rawText.substring(0, 200)}`);

      try {
        const data = JSON.parse(rawText);
        this.logger.log(`Balance check response: ${JSON.stringify(data)}`);
        return data;
      } catch {
        this.logger.error(`Balance check returned non-JSON (HTTP ${response.status}): ${rawText.substring(0, 100)}`);
        return {
          error: 'Invalid response from API',
          httpStatus: response.status,
          rawResponse: rawText.substring(0, 200),
        };
      }
    } catch (error) {
      this.logger.error(`Balance check failed: ${error.message}`, error.stack);
      return { error: error.message };
    }
  }
}
