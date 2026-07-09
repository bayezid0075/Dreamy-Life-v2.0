import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { RechargeService } from '../../application/services/recharge.service';
import { AdminGuard } from '../../../admin/guards/admin.guard';
import { WalletService } from '../../../wallet/application/services/wallet.service';

@ApiTags('Mobile Recharge')
@Controller('recharge')
export class RechargeController {
  private readonly logger = new Logger(RechargeController.name);

  constructor(
    private readonly rechargeService: RechargeService,
    private readonly jwtService: JwtService,
    private readonly walletService: WalletService,
  ) {}

  @Post('create')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a mobile recharge order' })
  @ApiResponse({ status: 201, description: 'Recharge order created' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createRecharge(
    @Req() req: Request,
    @Body() body: { phoneNumber: string; operator: string; connectionType: string; amount: number; source?: string },
  ) {
    const userId = this.extractUserId(req);
    this.logger.log(`POST /recharge/create user=${userId} phone=${body.phoneNumber} operator=${body.operator} amount=${body.amount} type=${body.connectionType} source=${body.source || 'recharge'}`);
    const result = await this.rechargeService.createRecharge(userId, body);
    this.logger.log(`Recharge created: orderId=${result.id} status=${result.status}`);

    const remainingBalance = await this.walletService.getFundsBalance(userId);

    return { success: true, data: { ...result, remainingBalance } };
  }

  @Get('orders')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get user recharge history' })
  async getUserOrders(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.extractUserId(req);
    this.logger.debug(`GET /recharge/orders user=${userId} page=${page || 1} limit=${limit || 20}`);
    const result = await this.rechargeService.getUserOrders(
      userId,
      Number(page) || 1,
      Number(limit) || 20,
    );
    return { success: true, data: result };
  }

  @Get('drive-pack-orders')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get user drive pack order history' })
  async getDrivePackOrders(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.extractUserId(req);
    this.logger.debug(`GET /recharge/drive-pack-orders user=${userId} page=${page || 1} limit=${limit || 20}`);
    const result = await this.rechargeService.getDrivePackOrders(
      userId,
      Number(page) || 1,
      Number(limit) || 20,
    );
    return { success: true, data: result };
  }

  @Get('orders/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get recharge order details' })
  async getOrder(@Param('id') id: string) {
    this.logger.debug(`GET /recharge/orders/${id}`);
    const result = await this.rechargeService.getOrder(id);
    return { success: true, data: result };
  }

  // Admin endpoints
  @Get('offer-packs')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get available offer packs (Drive Pack)' })
  async getOfferPacks() {
    this.logger.log('GET /recharge/offer-packs');
    const result = await this.rechargeService.getOfferPacks();
    return { success: true, data: result };
  }

  @Get('admin/config')
  @ApiBearerAuth('access-token')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get recharge configuration (admin)' })
  async getConfig() {
    this.logger.log('GET /recharge/admin/config');
    const result = await this.rechargeService.getConfig();
    return { success: true, data: result };
  }

  @Patch('admin/config')
  @ApiBearerAuth('access-token')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update recharge configuration (admin)' })
  async updateConfig(@Body() body: any) {
    this.logger.log(`PATCH /recharge/admin/config fields=[${Object.keys(body).join(', ')}]`);
    const result = await this.rechargeService.updateConfig(body);
    return { success: true, data: result };
  }

  @Get('admin/orders')
  @ApiBearerAuth('access-token')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all recharge orders (admin)' })
  async getAllOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    this.logger.debug(`GET /recharge/admin/orders page=${page || 1} limit=${limit || 20} status=${status || 'all'}`);
    const result = await this.rechargeService.getAllOrders(
      Number(page) || 1,
      Number(limit) || 20,
      status,
    );
    return { success: true, data: result };
  }

  @Get('admin/balance')
  @ApiBearerAuth('access-token')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Check API provider balance (admin)' })
  async getBalance() {
    this.logger.log('GET /recharge/admin/balance');
    const result = await this.rechargeService.getBalance();
    return { success: true, data: result };
  }

  private extractUserId(req: Request): string {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      this.logger.warn('Authorization header missing');
      throw new UnauthorizedException('Authorization header missing');
    }
    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'super_secret_jwt_key',
      });
      return payload.userId;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        this.logger.warn(`Token expired at ${error.expiredAt}`);
        throw new UnauthorizedException('Token expired');
      }
      this.logger.warn(`Invalid token: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
