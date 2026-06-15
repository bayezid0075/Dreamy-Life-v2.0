import { Controller, Get, Post, Body, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { WalletService } from '../../application/services/wallet.service';
import { AddFundsDto } from '../dto/add-funds.dto';
import {
  WalletResponse,
  TransactionsResponse,
  AddFundsResponse,
} from '../../../../common/dto/api-response.dto';

@ApiTags('Wallet')
@ApiBearerAuth('access-token')
@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user wallet balances (wallet, funds, points)' })
  @ApiResponse({ status: 200, description: 'Wallet balances', type: WalletResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWallet(@Req() req: any) {
    const userId = this.extractUserId(req);
    await this.walletService.seedIfEmpty(userId);
    const wallet = await this.walletService.getWallet(userId);
    return { success: true, data: { wallet } };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get filtered transaction history' })
  @ApiQuery({ name: 'type', required: false, enum: ['all', 'wallet', 'funds', 'points'] })
  @ApiQuery({ name: 'filter', required: false, enum: ['today', 'yesterday', '7d', '15d', '30d', 'all'] })
  @ApiResponse({ status: 200, description: 'Transaction list', type: TransactionsResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTransactions(
    @Req() req: any,
    @Query('type') type?: string,
    @Query('filter') filter?: string,
  ) {
    const userId = this.extractUserId(req);
    const transactions = await this.walletService.getTransactions(userId, type, filter);
    return { success: true, data: { transactions } };
  }

  @Post('add-funds')
  @ApiOperation({ summary: 'Add funds to funds balance' })
  @ApiResponse({ status: 201, description: 'Funds added successfully', type: AddFundsResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addFunds(@Req() req: any, @Body() body: AddFundsDto) {
    const userId = this.extractUserId(req);
    const result = await this.walletService.addFunds(userId, body.amount);
    return { success: true, data: result };
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
