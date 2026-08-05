import { Injectable, Inject, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, count, sql, and } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';
import { PaymentService } from './payment.service';
import { NotificationService } from '../../../notifications/application/notification.service';
import { NotificationGateway } from '../../../notifications/application/notification.gateway';

@Injectable()
export class VendorService {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
    private readonly paymentService: PaymentService,
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async applyForVendor(userId: string, shopName: string, address: string, bannerUrl?: string) {
    const existingVendor = await this.db.query.vendors.findFirst({
      where: eq(schema.vendors.userId, userId),
    });

    if (existingVendor) {
      if (existingVendor.status === 'banned') {
        throw new ForbiddenException('Your vendor account has been banned');
      }
      throw new ConflictException('You already have a vendor profile');
    }

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.memberStatus === 'vvip') {
      const [vendor] = await this.db
        .insert(schema.vendors)
        .values({
          userId,
          shopName,
          address,
          bannerUrl,
          paymentStatus: true,
          isActive: true,
        })
        .returning();

      await this.sendVendorCreatedNotification(userId, shopName, true);

      return {
        vendor: {
          id: vendor.id,
          shopName: vendor.shopName,
          isActive: vendor.isActive,
        },
        message: 'Vendor profile created successfully (VVIP member - no fee required)',
      };
    }

    const email = `user_${user.phoneNumber.replace(/[^0-9]/g, '')}@dreamylife.com`;
    const fullName = user.username;

    const { paymentUrl, invoiceId } = await this.paymentService.createVendorPayment(userId, email, fullName);

    await this.db
      .insert(schema.vendorPayments)
      .values({
        userId,
        invoiceId,
        amount: '700',
        fee: '0',
        chargedAmount: '700',
        metadata: { user_id: userId, purpose: 'vendor_creation', shopName, address, bannerUrl },
        status: 'pending',
      });

    return {
      paymentUrl,
      message: 'Please complete payment of Tk 700 to create your vendor profile',
    };
  }

  async verifyAndCreateVendor(invoiceId: string, userId?: string | null) {
    const paymentRecord = await this.db.query.vendorPayments.findFirst({
      where: eq(schema.vendorPayments.invoiceId, invoiceId),
    });

    if (!paymentRecord) {
      throw new NotFoundException('Payment record not found');
    }

    if (paymentRecord.status === 'completed') {
      const vendor = await this.db.query.vendors.findFirst({
        where: eq(schema.vendors.userId, paymentRecord.userId),
      });
      return {
        vendor: {
          id: vendor!.id,
          shopName: vendor!.shopName,
          isActive: vendor!.isActive,
        },
        message: 'Vendor profile already active',
      };
    }

    const verification = await this.paymentService.verifyPayment(invoiceId);

    await this.paymentService.savePaymentRecord(
      paymentRecord.userId,
      invoiceId,
      Number(verification.amount),
      Number(verification.fee),
      Number(verification.charged_amount),
      verification.payment_method,
      verification.sender_number,
      verification.transaction_id,
      verification.metadata as Record<string, unknown>,
      verification.status === 'COMPLETED' ? 'completed' : 'error',
    );

    if (verification.status !== 'COMPLETED') {
      throw new ConflictException('Payment not completed. Status: ' + verification.status);
    }

    const meta = paymentRecord.metadata as Record<string, string> || {};

    const existingVendor = await this.db.query.vendors.findFirst({
      where: eq(schema.vendors.userId, paymentRecord.userId),
    });

    if (existingVendor) {
      await this.db
        .update(schema.vendors)
        .set({ paymentStatus: true, isActive: true, updatedAt: new Date() })
        .where(eq(schema.vendors.id, existingVendor.id));

      await this.sendVendorCreatedNotification(paymentRecord.userId, existingVendor.shopName, false);

      return {
        vendor: {
          id: existingVendor.id,
          shopName: existingVendor.shopName,
          isActive: true,
        },
        message: 'Vendor profile activated successfully',
      };
    }

    const [vendor] = await this.db
      .insert(schema.vendors)
      .values({
        userId: paymentRecord.userId,
        shopName: meta.shopName || 'My Shop',
        address: meta.address || '',
        bannerUrl: meta.bannerUrl,
        paymentStatus: true,
        isActive: true,
      })
      .returning();

    await this.sendVendorCreatedNotification(paymentRecord.userId, vendor.shopName, false);

    return {
      vendor: {
        id: vendor.id,
        shopName: vendor.shopName,
        isActive: vendor.isActive,
      },
      message: 'Vendor profile created successfully',
    };
  }

  async handleWebhook(invoiceId: string) {
    try {
      await this.verifyAndCreateVendor(invoiceId);
    } catch {
      // Webhook errors should not throw
    }
  }

  async getVendorProfile(userId: string) {
    const vendor = await this.db.query.vendors.findFirst({
      where: eq(schema.vendors.userId, userId),
    });

    if (!vendor) {
      return null;
    }

    const productCount = await this.db
      .select({ value: count() })
      .from(schema.products)
      .where(eq(schema.products.vendorId, vendor.id));

    const orderCount = await this.db
      .select({ value: count() })
      .from(schema.resellerOrders)
      .where(eq(schema.resellerOrders.vendorId, vendor.id));

    const revenue = await this.db
      .select({ value: sql<string>`COALESCE(SUM(${schema.resellerOrders.vendorPrice}), 0)` })
      .from(schema.resellerOrders)
      .where(and(
        eq(schema.resellerOrders.vendorId, vendor.id),
        eq(schema.resellerOrders.status, 'delivered'),
      ));

    return {
      ...vendor,
      totalProducts: Number(productCount[0]?.value) || 0,
      totalOrders: Number(orderCount[0]?.value) || 0,
      totalRevenue: Number(revenue[0]?.value) || 0,
      status: vendor.status,
    };
  }

  async getVendorPublicProfile(vendorId: string) {
    const vendor = await this.db.query.vendors.findFirst({
      where: eq(schema.vendors.id, vendorId),
    });

    if (!vendor || !vendor.isActive) {
      throw new NotFoundException('Vendor not found');
    }

    const products = await this.db
      .select()
      .from(schema.products)
      .where(and(
        eq(schema.products.vendorId, vendorId),
        eq(schema.products.isActive, true),
      ))
      .orderBy(desc(schema.products.createdAt));

    return {
      vendor: {
        id: vendor.id,
        shopName: vendor.shopName,
        address: vendor.address,
        bannerUrl: vendor.bannerUrl,
        createdAt: vendor.createdAt,
      },
      products: products.map(p => ({
        ...p,
        actualPrice: Number(p.actualPrice),
        discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      })),
    };
  }

  async updateBanner(userId: string, bannerUrl: string) {
    const vendor = await this.db.query.vendors.findFirst({
      where: eq(schema.vendors.userId, userId),
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    await this.db
      .update(schema.vendors)
      .set({ bannerUrl, updatedAt: new Date() })
      .where(eq(schema.vendors.id, vendor.id));

    return { bannerUrl, message: 'Banner updated successfully' };
  }

  async getProductFeed(category?: string, search?: string, page = 1, limit = 20) {
    const conditions = [eq(schema.products.isActive, true)];

    if (category) {
      conditions.push(eq(schema.products.category, category));
    }

    const offset = (page - 1) * limit;

    let query = this.db
      .select({
        id: schema.products.id,
        vendorId: schema.products.vendorId,
        name: schema.products.name,
        description: schema.products.description,
        category: schema.products.category,
        actualPrice: schema.products.actualPrice,
        discountPrice: schema.products.discountPrice,
        deliveryChargeInside: schema.products.deliveryChargeInside,
        deliveryChargeOutside: schema.products.deliveryChargeOutside,
        stock: schema.products.stock,
        sku: schema.products.sku,
        imageUrls: schema.products.imageUrls,
        isActive: schema.products.isActive,
        createdAt: schema.products.createdAt,
        updatedAt: schema.products.updatedAt,
        shopName: schema.vendors.shopName,
        vendorUserId: schema.vendors.userId,
      })
      .from(schema.products)
      .innerJoin(schema.vendors, eq(schema.products.vendorId, schema.vendors.id))
      .where(and(...conditions))
      .orderBy(desc(schema.products.createdAt))
      .limit(limit)
      .offset(offset);

    if (search) {
      query = this.db
        .select({
          id: schema.products.id,
          vendorId: schema.products.vendorId,
          name: schema.products.name,
          description: schema.products.description,
          category: schema.products.category,
          actualPrice: schema.products.actualPrice,
          discountPrice: schema.products.discountPrice,
          deliveryChargeInside: schema.products.deliveryChargeInside,
          deliveryChargeOutside: schema.products.deliveryChargeOutside,
          stock: schema.products.stock,
          sku: schema.products.sku,
          imageUrls: schema.products.imageUrls,
          isActive: schema.products.isActive,
          createdAt: schema.products.createdAt,
          updatedAt: schema.products.updatedAt,
          shopName: schema.vendors.shopName,
          vendorUserId: schema.vendors.userId,
        })
        .from(schema.products)
        .innerJoin(schema.vendors, eq(schema.products.vendorId, schema.vendors.id))
        .where(and(...conditions, sql`${schema.products.name} ILIKE ${'%' + search + '%'}`))
        .orderBy(desc(schema.products.createdAt))
        .limit(limit)
        .offset(offset);
    }

    const products = await query;

    return products.map(p => ({
      ...p,
      actualPrice: Number(p.actualPrice),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      deliveryChargeInside: Number(p.deliveryChargeInside),
      deliveryChargeOutside: Number(p.deliveryChargeOutside),
    }));
  }

  private async sendVendorCreatedNotification(userId: string, shopName: string, isFree: boolean) {
    try {
      const userNotification = await this.notificationService.sendToUser(userId, {
        title: 'Vendor Shop Created',
        body: isFree
          ? `Your vendor shop "${shopName}" has been created successfully! Welcome aboard!`
          : `Payment received! Your vendor shop "${shopName}" is now active. Welcome aboard!`,
        icon: 'storefront',
        category: 'app',
        createdBy: userId,
      });

      this.notificationGateway.notifyUser(userId, {
        id: userNotification.id,
        title: 'Vendor Shop Created',
        body: isFree
          ? `Your vendor shop "${shopName}" has been created successfully! Welcome aboard!`
          : `Payment received! Your vendor shop "${shopName}" is now active. Welcome aboard!`,
        icon: 'storefront',
        category: 'app',
        createdAt: userNotification.createdAt?.toISOString() || new Date().toISOString(),
      });

      const admins = await this.db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.memberStatus, 'super_admin'));

      if (admins.length > 0) {
        const adminIds = admins.map(a => a.id);
        const adminNotification = await this.notificationService.sendToUsers(adminIds, {
          title: 'New Vendor Joined',
          body: isFree
            ? `New vendor "${shopName}" has joined (VVIP - free vendorship).`
            : `New vendor "${shopName}" has joined. Payment of ৳700 received.`,
          icon: 'person_add',
          category: 'app',
          createdBy: userId,
        });

        if (adminNotification) {
          for (const adminId of adminIds) {
            this.notificationGateway.notifyUser(adminId, {
              id: adminNotification.id,
              title: 'New Vendor Joined',
              body: isFree
                ? `New vendor "${shopName}" has joined (VVIP - free vendorship).`
                : `New vendor "${shopName}" has joined. Payment of ৳700 received.`,
              icon: 'person_add',
              category: 'app',
              createdAt: adminNotification.createdAt?.toISOString() || new Date().toISOString(),
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to send vendor notifications:', err);
    }
  }
}
