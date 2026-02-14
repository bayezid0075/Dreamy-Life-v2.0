class OrderItem {
  final int id;
  final int product;
  final String productTitle;
  final String productSku;
  final String? productImage;
  final int quantity;
  final String unitPrice;
  final String? resellerUnitPrice;
  final String subtotal;

  const OrderItem({
    required this.id,
    required this.product,
    required this.productTitle,
    required this.productSku,
    this.productImage,
    required this.quantity,
    required this.unitPrice,
    this.resellerUnitPrice,
    required this.subtotal,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'] as int,
      product: json['product'] as int,
      productTitle: json['product_title'] as String? ?? '',
      productSku: json['product_sku'] as String? ?? '',
      productImage: json['product_image'] as String?,
      quantity: json['quantity'] as int,
      unitPrice: json['unit_price'] as String,
      resellerUnitPrice: json['reseller_unit_price'] as String?,
      subtotal: json['subtotal'] as String,
    );
  }
}

class Order {
  final int id;
  final String orderNumber;
  final int user;
  final String userUsername;
  final String customerName;
  final String customerEmail;
  final String customerPhone;
  final String deliveryAddress;
  final String deliveryArea;
  final String subtotal;
  final String deliveryCharge;
  final String vatAmount;
  final String totalAmount;
  final bool resellerPriceApplied;
  final String? resellerPriceTotal;
  final String orderStatus;
  final String paymentStatus;
  final String? paymentMethod;
  final String? amountPaidAtPlacement;
  final String? dueAmount;
  final String createdAt;
  final String updatedAt;
  final List<OrderItem> items;

  const Order({
    required this.id,
    required this.orderNumber,
    required this.user,
    required this.userUsername,
    required this.customerName,
    required this.customerEmail,
    required this.customerPhone,
    required this.deliveryAddress,
    required this.deliveryArea,
    required this.subtotal,
    required this.deliveryCharge,
    required this.vatAmount,
    required this.totalAmount,
    required this.resellerPriceApplied,
    this.resellerPriceTotal,
    required this.orderStatus,
    required this.paymentStatus,
    this.paymentMethod,
    this.amountPaidAtPlacement,
    this.dueAmount,
    required this.createdAt,
    required this.updatedAt,
    this.items = const [],
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'] as int,
      orderNumber: json['order_number'] as String? ?? '',
      user: json['user'] as int,
      userUsername: json['user_username'] as String? ?? '',
      customerName: json['customer_name'] as String? ?? '',
      customerEmail: json['customer_email'] as String? ?? '',
      customerPhone: json['customer_phone'] as String? ?? '',
      deliveryAddress: json['delivery_address'] as String? ?? '',
      deliveryArea: json['delivery_area'] as String? ?? 'inside_dhaka',
      subtotal: json['subtotal'] as String,
      deliveryCharge: json['delivery_charge'] as String,
      vatAmount: json['vat_amount'] as String,
      totalAmount: json['total_amount'] as String,
      resellerPriceApplied: json['reseller_price_applied'] as bool? ?? false,
      resellerPriceTotal: json['reseller_price_total'] as String?,
      orderStatus: json['order_status'] as String? ?? 'placed',
      paymentStatus: json['payment_status'] as String? ?? 'pending',
      paymentMethod: json['payment_method'] as String?,
      amountPaidAtPlacement: json['amount_paid_at_placement'] as String?,
      dueAmount: json['due_amount'] as String?,
      createdAt: json['created_at'] as String,
      updatedAt: json['updated_at'] as String,
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class OrderItemPayload {
  final int productId;
  final int quantity;
  final String? resellerPrice;

  const OrderItemPayload({
    required this.productId,
    required this.quantity,
    this.resellerPrice,
  });

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{'product_id': productId, 'quantity': quantity};
    if (resellerPrice != null) m['reseller_price'] = resellerPrice;
    return m;
  }
}

class OrderCreatePayload {
  final List<OrderItemPayload> items;
  final String customerName;
  final String customerEmail;
  final String customerPhone;
  final String deliveryAddress;
  final String deliveryArea;
  final bool? applyResellerPrice;
  final String paymentMethod;
  final String? deliveryPaymentMethod;

  const OrderCreatePayload({
    required this.items,
    required this.customerName,
    required this.customerEmail,
    required this.customerPhone,
    required this.deliveryAddress,
    required this.deliveryArea,
    this.applyResellerPrice,
    required this.paymentMethod,
    this.deliveryPaymentMethod,
  });

  Map<String, dynamic> toJson() {
    final m = <String, dynamic>{
      'items': items.map((e) => e.toJson()).toList(),
      'customer_name': customerName,
      'customer_email': customerEmail,
      'customer_phone': customerPhone,
      'delivery_address': deliveryAddress,
      'delivery_area': deliveryArea,
      'payment_method': paymentMethod,
    };
    if (applyResellerPrice != null) m['apply_reseller_price'] = applyResellerPrice;
    if (deliveryPaymentMethod != null) m['delivery_payment_method'] = deliveryPaymentMethod;
    return m;
  }
}
