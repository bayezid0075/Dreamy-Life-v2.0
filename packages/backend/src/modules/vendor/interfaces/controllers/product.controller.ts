import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { ProductService } from '../../application/services/product.service';
import { VendorService } from '../../application/services/vendor.service';
import { CreateProductDto, UpdateProductDto } from '../dto/create-product.dto';

@ApiTags('Products')
@ApiBearerAuth('access-token')
@Controller('vendor/products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly vendorService: VendorService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List vendor own products' })
  async getMyProducts(@Req() req: any) {
    const userId = this.extractUserId(req);
    const vendor = await this.vendorService.getVendorProfile(userId);
    if (!vendor) {
      return { success: true, data: [] };
    }
    const products = await this.productService.getVendorProducts(vendor.id);
    return { success: true, data: products };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  async createProduct(@Req() req: any, @Body() body: CreateProductDto) {
    const userId = this.extractUserId(req);
    const vendor = await this.vendorService.getVendorProfile(userId);
    if (!vendor) {
      return { success: false, error: { code: 'NOT_VENDOR', message: 'You are not a vendor' } };
    }
    const product = await this.productService.createProduct(vendor.id, body);
    return { success: true, data: product };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  async updateProduct(@Req() req: any, @Param('id') id: string, @Body() body: UpdateProductDto) {
    const userId = this.extractUserId(req);
    const vendor = await this.vendorService.getVendorProfile(userId);
    if (!vendor) {
      return { success: false, error: { code: 'NOT_VENDOR', message: 'You are not a vendor' } };
    }
    const product = await this.productService.updateProduct(vendor.id, id, body);
    return { success: true, data: product };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product (soft delete)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  async deleteProduct(@Req() req: any, @Param('id') id: string) {
    const userId = this.extractUserId(req);
    const vendor = await this.vendorService.getVendorProfile(userId);
    if (!vendor) {
      return { success: false, error: { code: 'NOT_VENDOR', message: 'You are not a vendor' } };
    }
    const result = await this.productService.deleteProduct(vendor.id, id);
    return { success: true, data: result };
  }

  @Get('detail/:id')
  @ApiOperation({ summary: 'Get product detail (public)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  async getProductDetail(@Param('id') id: string) {
    const product = await this.productService.getProductDetail(id);
    return { success: true, data: product };
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
