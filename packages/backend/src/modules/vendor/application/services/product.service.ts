import { Injectable, Inject, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, and } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';

@Injectable()
export class ProductService {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getVendorProducts(vendorId: string) {
    const products = await this.db
      .select()
      .from(schema.products)
      .where(and(
        eq(schema.products.vendorId, vendorId),
        eq(schema.products.isActive, true),
      ))
      .orderBy(desc(schema.products.createdAt));

    return products.map(p => ({
      ...p,
      actualPrice: Number(p.actualPrice),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      resellerMrp: p.resellerMrp ? Number(p.resellerMrp) : null,
      deliveryChargeInside: Number(p.deliveryChargeInside),
      deliveryChargeOutside: Number(p.deliveryChargeOutside),
    }));
  }

  async createProduct(vendorId: string, data: {
    name: string;
    description?: string;
    category: string;
    subcategory?: string;
    actualPrice: number;
    discountPrice?: number;
    resellerMrp?: number;
    deliveryChargeInside?: number;
    deliveryChargeOutside?: number;
    colors?: string[];
    sizes?: string[];
    variantPrices?: Record<string, { price: number }>;
    stock: number;
    sku?: string;
    imageUrls?: string[];
  }) {
    const vendor = await this.db.query.vendors.findFirst({
      where: eq(schema.vendors.id, vendorId),
    });

    if (!vendor || !vendor.isActive) {
      throw new ForbiddenException('You are not an active vendor');
    }

    const sku = data.sku || this.generateSku(data.name);

    const existingSku = await this.db.query.products.findFirst({
      where: eq(schema.products.sku, sku),
    });

    if (existingSku) {
      throw new ConflictException('Product with this SKU already exists');
    }

    const [product] = await this.db
      .insert(schema.products)
      .values({
        vendorId,
        name: data.name,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        actualPrice: String(data.actualPrice),
        discountPrice: data.discountPrice ? String(data.discountPrice) : null,
        resellerMrp: data.resellerMrp ? String(data.resellerMrp) : null,
        deliveryChargeInside: String(data.deliveryChargeInside ?? 0),
        deliveryChargeOutside: String(data.deliveryChargeOutside ?? 0),
        colors: data.colors || [],
        sizes: data.sizes || [],
        variantPrices: data.variantPrices || {},
        stock: data.stock,
        sku,
        imageUrls: data.imageUrls || [],
      })
      .returning();

    return {
      ...product,
      actualPrice: Number(product.actualPrice),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
      resellerMrp: product.resellerMrp ? Number(product.resellerMrp) : null,
      deliveryChargeInside: Number(product.deliveryChargeInside),
      deliveryChargeOutside: Number(product.deliveryChargeOutside),
    };
  }

  async updateProduct(vendorId: string, productId: string, data: {
    name?: string;
    description?: string;
    category?: string;
    subcategory?: string;
    actualPrice?: number;
    discountPrice?: number;
    resellerMrp?: number;
    deliveryChargeInside?: number;
    deliveryChargeOutside?: number;
    colors?: string[];
    sizes?: string[];
    variantPrices?: Record<string, { price: number }>;
    stock?: number;
    imageUrls?: string[];
  }) {
    const product = await this.db.query.products.findFirst({
      where: eq(schema.products.id, productId),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.vendorId !== vendorId) {
      throw new ForbiddenException('You can only edit your own products');
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.subcategory !== undefined) updateData.subcategory = data.subcategory;
    if (data.actualPrice !== undefined) updateData.actualPrice = String(data.actualPrice);
    if (data.discountPrice !== undefined) updateData.discountPrice = data.discountPrice ? String(data.discountPrice) : null;
    if (data.resellerMrp !== undefined) updateData.resellerMrp = data.resellerMrp ? String(data.resellerMrp) : null;
    if (data.deliveryChargeInside !== undefined) updateData.deliveryChargeInside = String(data.deliveryChargeInside);
    if (data.deliveryChargeOutside !== undefined) updateData.deliveryChargeOutside = String(data.deliveryChargeOutside);
    if (data.colors !== undefined) updateData.colors = data.colors;
    if (data.sizes !== undefined) updateData.sizes = data.sizes;
    if (data.variantPrices !== undefined) updateData.variantPrices = data.variantPrices;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.imageUrls !== undefined) updateData.imageUrls = data.imageUrls;

    const [updated] = await this.db
      .update(schema.products)
      .set(updateData)
      .where(eq(schema.products.id, productId))
      .returning();

    return {
      ...updated,
      actualPrice: Number(updated.actualPrice),
      discountPrice: updated.discountPrice ? Number(updated.discountPrice) : null,
      resellerMrp: updated.resellerMrp ? Number(updated.resellerMrp) : null,
      deliveryChargeInside: Number(updated.deliveryChargeInside),
      deliveryChargeOutside: Number(updated.deliveryChargeOutside),
    };
  }

  async deleteProduct(vendorId: string, productId: string) {
    const product = await this.db.query.products.findFirst({
      where: eq(schema.products.id, productId),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.vendorId !== vendorId) {
      throw new ForbiddenException('You can only delete your own products');
    }

    await this.db
      .update(schema.products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.products.id, productId));

    return { message: 'Product deleted successfully' };
  }

  async getProductDetail(productId: string) {
    const product = await this.db
      .select({
        id: schema.products.id,
        vendorId: schema.products.vendorId,
        name: schema.products.name,
        description: schema.products.description,
        category: schema.products.category,
        subcategory: schema.products.subcategory,
        actualPrice: schema.products.actualPrice,
        discountPrice: schema.products.discountPrice,
        resellerMrp: schema.products.resellerMrp,
        deliveryChargeInside: schema.products.deliveryChargeInside,
        deliveryChargeOutside: schema.products.deliveryChargeOutside,
        colors: schema.products.colors,
        sizes: schema.products.sizes,
        variantPrices: schema.products.variantPrices,
        stock: schema.products.stock,
        sku: schema.products.sku,
        imageUrls: schema.products.imageUrls,
        isActive: schema.products.isActive,
        createdAt: schema.products.createdAt,
        updatedAt: schema.products.updatedAt,
        shopName: schema.vendors.shopName,
        vendorAddress: schema.vendors.address,
      })
      .from(schema.products)
      .innerJoin(schema.vendors, eq(schema.products.vendorId, schema.vendors.id))
      .where(and(
        eq(schema.products.id, productId),
        eq(schema.products.isActive, true),
      ));

    if (!product.length) {
      throw new NotFoundException('Product not found');
    }

    return {
      ...product[0],
      actualPrice: Number(product[0].actualPrice),
      discountPrice: product[0].discountPrice ? Number(product[0].discountPrice) : null,
      resellerMrp: product[0].resellerMrp ? Number(product[0].resellerMrp) : null,
      deliveryChargeInside: Number(product[0].deliveryChargeInside),
      deliveryChargeOutside: Number(product[0].deliveryChargeOutside),
    };
  }

  private generateSku(name: string): string {
    const prefix = name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .map(w => w.substring(0, 2).toUpperCase())
      .join('')
      .substring(0, 6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${random}`;
  }
}
