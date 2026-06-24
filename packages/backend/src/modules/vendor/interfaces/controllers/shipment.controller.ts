import { Controller, Get, Post, Patch, Body, Param, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { ShipmentService } from '../../application/services/shipment.service';
import { VendorService } from '../../application/services/vendor.service';
import { CreateShipmentDto, UpdateShipmentDto } from '../dto/create-reseller-order.dto';

@ApiTags('Shipments')
@ApiBearerAuth('access-token')
@Controller('vendor/shipments')
export class ShipmentController {
  constructor(
    private readonly shipmentService: ShipmentService,
    private readonly vendorService: VendorService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create shipment for order (vendor only)' })
  async createShipment(@Req() req: any, @Body() body: CreateShipmentDto) {
    const userId = this.extractUserId(req);
    const vendor = await this.vendorService.getVendorProfile(userId);
    if (!vendor) {
      return { success: false, error: { code: 'NOT_VENDOR', message: 'You are not a vendor' } };
    }
    const shipment = await this.shipmentService.createShipment(vendor.id, body);
    return { success: true, data: shipment };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shipment status' })
  @ApiParam({ name: 'id', description: 'Shipment ID' })
  async updateShipment(@Req() req: any, @Param('id') id: string, @Body() body: UpdateShipmentDto) {
    const userId = this.extractUserId(req);
    const vendor = await this.vendorService.getVendorProfile(userId);
    if (!vendor) {
      return { success: false, error: { code: 'NOT_VENDOR', message: 'You are not a vendor' } };
    }
    const shipment = await this.shipmentService.updateShipment(vendor.id, id, body);
    return { success: true, data: shipment };
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get shipment for order' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  async getShipment(@Param('orderId') orderId: string) {
    const shipments = await this.shipmentService.getShipmentByOrder(orderId);
    return { success: true, data: shipments };
  }

  @Get('tracking/:orderId')
  @ApiOperation({ summary: 'Track order shipment' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  async trackOrder(@Param('orderId') orderId: string) {
    const tracking = await this.shipmentService.getOrderTracking(orderId);
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
