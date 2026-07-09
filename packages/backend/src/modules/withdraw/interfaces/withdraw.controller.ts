import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WithdrawService } from '../application/withdraw.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('withdraw')
export class WithdrawController {
  constructor(private readonly withdrawService: WithdrawService) {}

  @Get('config')
  async getConfig() {
    return this.withdrawService.getConfig();
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async create(
    @Request() req: any,
    @Body() body: { amount: number; method: string; phoneNumber: string },
  ) {
    return this.withdrawService.createWithdraw(req.user.userId, body);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.withdrawService.getUserWithdrawals(
      req.user.userId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  async getAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
  ) {
    return this.withdrawService.getAllWithdrawals(
      parseInt(page, 10),
      parseInt(limit, 10),
      status,
    );
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    return this.withdrawService.getWithdrawStats();
  }

  @Patch('admin/config')
  @UseGuards(JwtAuthGuard)
  async updateConfig(
    @Body() body: { minimumBalance?: string; chargePercent?: string; isActive?: boolean },
  ) {
    return this.withdrawService.updateConfig(body);
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; adminNote?: string },
  ) {
    return this.withdrawService.updateWithdrawStatus(id, body.status, body.adminNote);
  }
}
