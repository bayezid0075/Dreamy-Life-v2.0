import { Controller, Get, Post, Patch, Body, Param, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { ResellingService } from '../../application/services/reselling.service';
import { VendorService } from '../../application/services/vendor.service';
import { FundPaymentService } from '../../../wallet/application/services/fund-payment.service';
import { CreateResellerOrderDto, UpdateOrderStatusDto } from '../dto/create-reseller-order.dto';

@ApiTags('Reselling')
@ApiBearerAuth('access-token')
@Controller('reselling')
export class ResellingController {
  constructor(
    private readonly resellingService: ResellingService,
    private readonly vendorService: VendorService,
    private readonly fundPaymentService: FundPaymentService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('order')
  @ApiOperation({ summary: 'Place a reseller order' })
  async createOrder(@Req() req: any, @Body() body: CreateResellerOrderDto) {
    const userId = this.extractUserId(req);
    const order = await this.resellingService.createOrder(userId, body);
    return { success: true, data: order };
  }

  @Post('delivery-payment')
  @ApiOperation({ summary: 'Create online payment for delivery charge' })
  async createDeliveryPayment(@Req() req: any, @Body() body: { amount: number; orderId: string }) {
    const userId = this.extractUserId(req);
    const result = await this.fundPaymentService.createFundPayment(userId, body.amount);
    return { success: true, data: { checkoutUrl: result.paymentUrl, invoiceId: result.invoiceId } };
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get reseller order history' })
  async getMyOrders(@Req() req: any) {
    const userId = this.extractUserId(req);
    const orders = await this.resellingService.getMyOrders(userId);
    return { success: true, data: orders };
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order detail with shipment tracking' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async getOrderDetail(@Req() req: any, @Param('id') id: string) {
    const userId = this.extractUserId(req);
    const order = await this.resellingService.getOrderDetail(userId, id);
    return { success: true, data: order };
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update order status (vendor only)' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async updateOrderStatus(@Req() req: any, @Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    const userId = this.extractUserId(req);
    const vendor = await this.vendorService.getVendorProfile(userId);
    if (!vendor) {
      return { success: false, error: { code: 'NOT_VENDOR', message: 'You are not a vendor' } };
    }
    const order = await this.resellingService.updateOrderStatus(vendor.id, id, body.status);
    return { success: true, data: order };
  }

  @Get('orders/:id/tracking')
  @ApiOperation({ summary: 'Track order shipment' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async trackOrder(@Req() req: any, @Param('id') id: string) {
    const userId = this.extractUserId(req);
    const tracking = await this.resellingService.getOrderDetail(userId, id);
    return { success: true, data: tracking };
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
