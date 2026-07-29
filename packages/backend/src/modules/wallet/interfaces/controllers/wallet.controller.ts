import { Controller, Get, Post, Body, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { WalletService } from '../../application/services/wallet.service';
import { FundPaymentService } from '../../application/services/fund-payment.service';
import { AddFundsDto } from '../dto/add-funds.dto';
import { CreateFundPaymentDto, PaymentCallbackDto } from '../dto/create-fund-payment.dto';

@ApiTags('Wallet')
@ApiBearerAuth('access-token')
@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly fundPaymentService: FundPaymentService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user wallet balances (wallet, funds, points)' })
  @ApiResponse({ status: 200, description: 'Wallet balances' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWallet(@Req() req: any) {
    const userId = this.extractUserId(req);
    const wallet = await this.walletService.getAllBalances(userId);
    return { success: true, data: { wallet } };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get filtered transaction history' })
  @ApiQuery({ name: 'type', required: false, enum: ['all', 'wallet', 'funds', 'points'] })
  @ApiQuery({ name: 'filter', required: false, enum: ['today', 'yesterday', '7d', '15d', '30d', 'all'] })
  @ApiResponse({ status: 200, description: 'Transaction list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTransactions(
    @Req() req: any,
    @Query('type') type?: string,
    @Query('filter') filter?: string,
  ) {
    const userId = this.extractUserId(req);
    const transactions = await this.walletService.getAllTransactions(userId, type, filter);
    return { success: true, data: { transactions } };
  }

  @Get('wallet-transactions')
  @ApiOperation({ summary: 'Get wallet (earnings) transaction history' })
  @ApiQuery({ name: 'filter', required: false, enum: ['today', 'yesterday', '7d', '15d', '30d', 'all'] })
  async getWalletTransactions(@Req() req: any, @Query('filter') filter?: string) {
    const userId = this.extractUserId(req);
    const transactions = await this.walletService.getWalletTransactions(userId, filter);
    return { success: true, data: { transactions } };
  }

  @Get('fund-transactions')
  @ApiOperation({ summary: 'Get fund (spending) transaction history' })
  @ApiQuery({ name: 'filter', required: false, enum: ['today', 'yesterday', '7d', '15d', '30d', 'all'] })
  async getFundTransactions(@Req() req: any, @Query('filter') filter?: string) {
    const userId = this.extractUserId(req);
    const transactions = await this.walletService.getFundTransactions(userId, filter);
    return { success: true, data: { transactions } };
  }

  @Get('point-transactions')
  @ApiOperation({ summary: 'Get point (rewards) transaction history' })
  @ApiQuery({ name: 'filter', required: false, enum: ['today', 'yesterday', '7d', '15d', '30d', 'all'] })
  async getPointTransactions(@Req() req: any, @Query('filter') filter?: string) {
    const userId = this.extractUserId(req);
    const transactions = await this.walletService.getPointTransactions(userId, filter);
    return { success: true, data: { transactions } };
  }

  @Post('add-funds')
  @ApiOperation({ summary: 'Add funds to funds balance (direct, no gateway)' })
  @ApiResponse({ status: 201, description: 'Funds added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addFunds(@Req() req: any, @Body() body: AddFundsDto) {
    const userId = this.extractUserId(req);
    const result = await this.walletService.creditFunds(userId, body.amount, `Added ৳${body.amount.toFixed(2)} via bKash`);
    return { success: true, data: result };
  }

  @Post('create-payment')
  @ApiOperation({ summary: 'Create UddoktaPay payment session for fund addition' })
  @ApiResponse({ status: 200, description: 'Payment URL created' })
  @ApiResponse({ status: 400, description: 'Invalid amount' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPayment(@Req() req: any, @Body() body: CreateFundPaymentDto) {
    const userId = this.extractUserId(req);
    const result = await this.fundPaymentService.createFundPayment(userId, body.amount);
    return { success: true, data: { paymentUrl: result.paymentUrl, invoiceId: result.invoiceId } };
  }

  @Post('payment-success')
  @ApiOperation({ summary: 'UddoktaPay payment success callback (no auth required)' })
  @ApiResponse({ status: 200, description: 'Payment processed' })
  async paymentSuccess(@Body() body: PaymentCallbackDto) {
    const result = await this.fundPaymentService.handlePaymentSuccess(body.invoice_id);
    return { success: result.success, data: result };
  }

  @Post('payment-cancel')
  @ApiOperation({ summary: 'UddoktaPay payment cancel callback' })
  @ApiResponse({ status: 200, description: 'Payment cancelled' })
  async paymentCancel(@Body() body: PaymentCallbackDto) {
    const result = await this.fundPaymentService.handlePaymentCancel(body.invoice_id);
    return { success: true, data: result };
  }

  @Post('payment-webhook')
  @ApiOperation({ summary: 'UddoktaPay IPN webhook for fund payments' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async paymentWebhook(@Body() body: PaymentCallbackDto) {
    const result = await this.fundPaymentService.handlePaymentSuccess(body.invoice_id);
    return { success: result.success };
  }

  private extractUserId(req: any): string {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new UnauthorizedException('Authorization required');
    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'super_secret_jwt_key',
      });
      return payload.userId;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
