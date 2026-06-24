import { Controller, Get, Post, Patch, Body, Param, Req, Query, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { VendorService } from '../../application/services/vendor.service';
import { CreateVendorDto, UpdateVendorBannerDto, VerifyPaymentDto } from '../dto/create-vendor.dto';

@ApiTags('Vendor')
@Controller('vendor')
export class VendorController {
  constructor(
    private readonly vendorService: VendorService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('apply')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Apply for vendor (VVIP=free, others=Tk700)' })
  async applyForVendor(@Req() req: any, @Body() body: CreateVendorDto) {
    const userId = this.extractUserId(req);
    const result = await this.vendorService.applyForVendor(userId, body.shopName, body.address, body.bannerUrl);
    return { success: true, data: result };
  }

  @Post('payment-success')
  @ApiOperation({ summary: 'UddoktaPay payment success callback' })
  async paymentSuccess(@Req() req: any, @Body() body: VerifyPaymentDto) {
    let userId: string | null = null;
    try {
      userId = this.extractUserId(req);
    } catch {
      // Allow unauthenticated access for UddoktaPay callbacks
    }
    const result = await this.vendorService.verifyAndCreateVendor(body.invoiceId, userId);
    return { success: true, data: result };
  }

  @Post('payment-webhook')
  @ApiOperation({ summary: 'UddoktaPay IPN webhook' })
  async paymentWebhook(@Body() body: { invoice_id: string }) {
    await this.vendorService.handleWebhook(body.invoice_id);
    return { success: true };
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user vendor profile' })
  async getMyVendorProfile(@Req() req: any) {
    const userId = this.extractUserId(req);
    const vendor = await this.vendorService.getVendorProfile(userId);
    return { success: true, data: vendor };
  }

  @Patch('banner')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update vendor banner image' })
  async updateBanner(@Req() req: any, @Body() body: UpdateVendorBannerDto) {
    const userId = this.extractUserId(req);
    const result = await this.vendorService.updateBanner(userId, body.bannerUrl);
    return { success: true, data: result };
  }

  @Get('feed')
  @ApiOperation({ summary: 'Get public product feed' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getProductFeed(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.vendorService.getProductFeed(
      category,
      search,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
    return { success: true, data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor public profile' })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  async getVendorPublicProfile(@Param('id') id: string) {
    const result = await this.vendorService.getVendorPublicProfile(id);
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
