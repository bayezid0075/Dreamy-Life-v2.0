import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';

@Injectable()
export class ShipmentService {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async createShipment(vendorId: string, data: { orderId: string; trackingNumber?: string; carrier?: string; shippingAddress: string; estimatedDelivery?: string; notes?: string }) {
    const order = await this.db.query.resellerOrders.findFirst({
      where: eq(schema.resellerOrders.id, data.orderId),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.vendorId !== vendorId) {
      throw new ForbiddenException('You can only create shipments for your orders');
    }

    if (order.status !== 'confirmed' && order.status !== 'pending') {
      throw new BadRequestException('Order must be confirmed before creating a shipment');
    }

    const existingShipment = await this.db.query.shipments.findFirst({
      where: eq(schema.shipments.orderId, data.orderId),
    });

    if (existingShipment) {
      throw new BadRequestException('Shipment already exists for this order');
    }

    const [shipment] = await this.db
      .insert(schema.shipments)
      .values({
        orderId: data.orderId,
        vendorId,
        trackingNumber: data.trackingNumber,
        carrier: data.carrier || 'self',
        shippingAddress: data.shippingAddress,
        estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
        notes: data.notes,
      })
      .returning();

    await this.db
      .update(schema.resellerOrders)
      .set({ status: 'shipped', updatedAt: new Date() })
      .where(eq(schema.resellerOrders.id, data.orderId));

    return shipment;
  }

  async updateShipment(vendorId: string, shipmentId: string, data: { status?: string; trackingNumber?: string; carrier?: string; notes?: string }) {
    const shipment = await this.db.query.shipments.findFirst({
      where: eq(schema.shipments.id, shipmentId),
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    if (shipment.vendorId !== vendorId) {
      throw new ForbiddenException('You can only update your own shipments');
    }

    const validStatuses = ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new BadRequestException('Invalid shipment status');
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.status) updateData.status = data.status;
    if (data.trackingNumber) updateData.trackingNumber = data.trackingNumber;
    if (data.carrier) updateData.carrier = data.carrier;
    if (data.notes) updateData.notes = data.notes;
    if (data.status === 'delivered') updateData.deliveredAt = new Date();

    const [updated] = await this.db
      .update(schema.shipments)
      .set(updateData)
      .where(eq(schema.shipments.id, shipmentId))
      .returning();

    if (data.status === 'delivered') {
      await this.db
        .update(schema.resellerOrders)
        .set({ status: 'delivered', updatedAt: new Date() })
        .where(eq(schema.resellerOrders.id, shipment.orderId));
    }

    return updated;
  }

  async getShipmentByOrder(orderId: string) {
    const shipments = await this.db
      .select()
      .from(schema.shipments)
      .where(eq(schema.shipments.orderId, orderId))
      .orderBy(desc(schema.shipments.createdAt));

    return shipments;
  }

  async getOrderTracking(orderId: string) {
    const order = await this.db.query.resellerOrders.findFirst({
      where: eq(schema.resellerOrders.id, orderId),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const shipments = await this.db
      .select()
      .from(schema.shipments)
      .where(eq(schema.shipments.orderId, orderId))
      .orderBy(desc(schema.shipments.createdAt));

    const timeline: Array<{ status: string; timestamp: Date; description: string }> = [];

    timeline.push({
      status: 'order_placed',
      timestamp: order.createdAt,
      description: 'Order has been placed',
    });

    if (order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered') {
      timeline.push({
        status: 'confirmed',
        timestamp: order.updatedAt,
        description: 'Order has been confirmed by vendor',
      });
    }

    for (const shipment of shipments) {
      const statusDescriptions: Record<string, string> = {
        pending: 'Shipment is being prepared',
        picked_up: 'Package has been picked up',
        in_transit: 'Package is in transit',
        out_for_delivery: 'Package is out for delivery',
        delivered: 'Package has been delivered',
        returned: 'Package has been returned',
      };

      timeline.push({
        status: shipment.status,
        timestamp: shipment.updatedAt,
        description: statusDescriptions[shipment.status] || 'Status updated',
      });
    }

    return {
      order: {
        id: order.id,
        status: order.status,
        customerName: order.customerName,
        customerAddress: order.customerAddress,
      },
      shipment: shipments[0] || null,
      timeline,
    };
  }
}
