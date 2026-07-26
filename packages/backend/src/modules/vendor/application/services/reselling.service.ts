import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, and } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';
import { WalletService } from '../../../wallet/application/services/wallet.service';

@Injectable()
export class ResellingService {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
    private readonly walletService: WalletService,
  ) {}

  async createOrder(resellerId: string, data: { productId: string; customerName: string; customerPhone: string; customerAltPhone?: string; resellerPrice: number; customerAddress: string; paymentMethod: string; deliveryMethod?: string; deliveryCharge?: number }) {
    const product = await this.db.query.products.findFirst({
      where: eq(schema.products.id, data.productId),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    if (product.stock < 1) {
      throw new BadRequestException('Product is out of stock');
    }

    const vendorPrice = Number(product.discountPrice) || Number(product.actualPrice);
    const profit = data.resellerPrice - vendorPrice;

    if (profit < 0) {
      throw new BadRequestException('Reseller price cannot be lower than vendor price');
    }

    const deliveryCharge = data.deliveryCharge || 0;

    if (data.paymentMethod === 'funds' && deliveryCharge > 0) {
      await this.walletService.debitFunds(resellerId, deliveryCharge, `Delivery charge for order`);
    }

    const [order] = await this.db
      .insert(schema.resellerOrders)
      .values({
        resellerId,
        vendorId: product.vendorId,
        productId: data.productId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAltPhone: data.customerAltPhone,
        resellerPrice: String(data.resellerPrice),
        vendorPrice: String(vendorPrice),
        profit: String(profit),
        customerAddress: data.customerAddress,
        paymentMethod: data.paymentMethod,
        deliveryMethod: data.deliveryMethod || null,
        deliveryCharge: String(deliveryCharge),
      })
      .returning();

    await this.db
      .update(schema.products)
      .set({ stock: product.stock - 1, updatedAt: new Date() })
      .where(eq(schema.products.id, data.productId));

    return {
      ...order,
      resellerPrice: Number(order.resellerPrice),
      vendorPrice: Number(order.vendorPrice),
      profit: Number(order.profit),
      deliveryCharge: Number(order.deliveryCharge),
    };
  }

  async getMyOrders(resellerId: string) {
    const orders = await this.db
      .select({
        id: schema.resellerOrders.id,
        resellerId: schema.resellerOrders.resellerId,
        vendorId: schema.resellerOrders.vendorId,
        productId: schema.resellerOrders.productId,
        customerName: schema.resellerOrders.customerName,
        customerPhone: schema.resellerOrders.customerPhone,
        customerAltPhone: schema.resellerOrders.customerAltPhone,
        resellerPrice: schema.resellerOrders.resellerPrice,
        vendorPrice: schema.resellerOrders.vendorPrice,
        profit: schema.resellerOrders.profit,
        customerAddress: schema.resellerOrders.customerAddress,
        paymentMethod: schema.resellerOrders.paymentMethod,
        deliveryMethod: schema.resellerOrders.deliveryMethod,
        deliveryCharge: schema.resellerOrders.deliveryCharge,
        status: schema.resellerOrders.status,
        createdAt: schema.resellerOrders.createdAt,
        updatedAt: schema.resellerOrders.updatedAt,
        productName: schema.products.name,
        productImage: schema.products.imageUrls,
        shopName: schema.vendors.shopName,
      })
      .from(schema.resellerOrders)
      .innerJoin(schema.products, eq(schema.resellerOrders.productId, schema.products.id))
      .innerJoin(schema.vendors, eq(schema.resellerOrders.vendorId, schema.vendors.id))
      .where(eq(schema.resellerOrders.resellerId, resellerId))
      .orderBy(desc(schema.resellerOrders.createdAt));

    return orders.map(o => ({
      ...o,
      resellerPrice: Number(o.resellerPrice),
      vendorPrice: Number(o.vendorPrice),
      profit: Number(o.profit),
      deliveryCharge: Number(o.deliveryCharge),
    }));
  }

  async getOrderDetail(resellerId: string, orderId: string) {
    const orders = await this.db
      .select({
        id: schema.resellerOrders.id,
        resellerId: schema.resellerOrders.resellerId,
        vendorId: schema.resellerOrders.vendorId,
        productId: schema.resellerOrders.productId,
        customerName: schema.resellerOrders.customerName,
        customerPhone: schema.resellerOrders.customerPhone,
        customerAltPhone: schema.resellerOrders.customerAltPhone,
        resellerPrice: schema.resellerOrders.resellerPrice,
        vendorPrice: schema.resellerOrders.vendorPrice,
        profit: schema.resellerOrders.profit,
        customerAddress: schema.resellerOrders.customerAddress,
        paymentMethod: schema.resellerOrders.paymentMethod,
        deliveryMethod: schema.resellerOrders.deliveryMethod,
        deliveryCharge: schema.resellerOrders.deliveryCharge,
        status: schema.resellerOrders.status,
        createdAt: schema.resellerOrders.createdAt,
        updatedAt: schema.resellerOrders.updatedAt,
        productName: schema.products.name,
        productDescription: schema.products.description,
        productImage: schema.products.imageUrls,
        shopName: schema.vendors.shopName,
      })
      .from(schema.resellerOrders)
      .innerJoin(schema.products, eq(schema.resellerOrders.productId, schema.products.id))
      .innerJoin(schema.vendors, eq(schema.resellerOrders.vendorId, schema.vendors.id))
      .where(and(
        eq(schema.resellerOrders.id, orderId),
        eq(schema.resellerOrders.resellerId, resellerId),
      ));

    if (!orders.length) {
      throw new NotFoundException('Order not found');
    }

    const order = orders[0];

    const shipments = await this.db
      .select()
      .from(schema.shipments)
      .where(eq(schema.shipments.orderId, orderId))
      .orderBy(desc(schema.shipments.createdAt));

    return {
      ...order,
      resellerPrice: Number(order.resellerPrice),
      vendorPrice: Number(order.vendorPrice),
      profit: Number(order.profit),
      deliveryCharge: Number(order.deliveryCharge),
      shipments: shipments.map(s => ({
        ...s,
        estimatedDelivery: s.estimatedDelivery,
        deliveredAt: s.deliveredAt,
      })),
    };
  }

  async getVendorOrders(vendorId: string) {
    const orders = await this.db
      .select({
        id: schema.resellerOrders.id,
        resellerId: schema.resellerOrders.resellerId,
        vendorId: schema.resellerOrders.vendorId,
        productId: schema.resellerOrders.productId,
        customerName: schema.resellerOrders.customerName,
        customerPhone: schema.resellerOrders.customerPhone,
        resellerPrice: schema.resellerOrders.resellerPrice,
        vendorPrice: schema.resellerOrders.vendorPrice,
        profit: schema.resellerOrders.profit,
        deliveryMethod: schema.resellerOrders.deliveryMethod,
        deliveryCharge: schema.resellerOrders.deliveryCharge,
        status: schema.resellerOrders.status,
        createdAt: schema.resellerOrders.createdAt,
        productName: schema.products.name,
        resellerName: schema.users.username,
      })
      .from(schema.resellerOrders)
      .innerJoin(schema.products, eq(schema.resellerOrders.productId, schema.products.id))
      .innerJoin(schema.users, eq(schema.resellerOrders.resellerId, schema.users.id))
      .where(eq(schema.resellerOrders.vendorId, vendorId))
      .orderBy(desc(schema.resellerOrders.createdAt));

    return orders.map(o => ({
      ...o,
      resellerPrice: Number(o.resellerPrice),
      vendorPrice: Number(o.vendorPrice),
      profit: Number(o.profit),
      deliveryCharge: Number(o.deliveryCharge),
    }));
  }

  async updateOrderStatus(vendorId: string, orderId: string, status: string) {
    const order = await this.db.query.resellerOrders.findFirst({
      where: eq(schema.resellerOrders.id, orderId),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.vendorId !== vendorId) {
      throw new ForbiddenException('You can only update orders for your products');
    }

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    const [updated] = await this.db
      .update(schema.resellerOrders)
      .set({ status: status as string, updatedAt: new Date() })
      .where(eq(schema.resellerOrders.id, orderId))
      .returning();

    return {
      ...updated,
      resellerPrice: Number(updated.resellerPrice),
      vendorPrice: Number(updated.vendorPrice),
      profit: Number(updated.profit),
      deliveryCharge: Number(updated.deliveryCharge),
    };
  }
}
