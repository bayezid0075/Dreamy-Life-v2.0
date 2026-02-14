class ProductImage {
  final int id;
  final String image;

  const ProductImage({required this.id, required this.image});

  factory ProductImage.fromJson(Map<String, dynamic> json) {
    return ProductImage(
      id: json['id'] as int,
      image: json['image'] as String,
    );
  }
}

class Product {
  final int id;
  final int? vendorId;
  final String? vendorName;
  final String title;
  final String description;
  final String sku;
  final int? category;
  final String? categoryName;
  final List<dynamic> subCategories;
  final int? brand;
  final String? brandName;
  final List<String> tags;
  final String price;
  final String? discountPrice;
  final String? effectivePrice;
  final String? resellerMrpPrice;
  final String? deliveryChargeInsideDhaka;
  final String? deliveryChargeOutsideDhaka;
  final String vat;
  final List<ProductImage> images;
  final String createdAt;

  const Product({
    required this.id,
    this.vendorId,
    this.vendorName,
    required this.title,
    required this.description,
    required this.sku,
    this.category,
    this.categoryName,
    this.subCategories = const [],
    this.brand,
    this.brandName,
    this.tags = const [],
    required this.price,
    this.discountPrice,
    this.effectivePrice,
    this.resellerMrpPrice,
    this.deliveryChargeInsideDhaka,
    this.deliveryChargeOutsideDhaka,
    this.vat = '0',
    this.images = const [],
    required this.createdAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] as int,
      vendorId: json['vendor_id'] as int? ?? json['vendor'] as int?,
      vendorName: json['vendor_name'] as String?,
      title: json['title'] as String,
      description: json['description'] as String? ?? '',
      sku: json['sku'] as String? ?? '',
      category: json['category'] as int?,
      categoryName: json['category_name'] as String?,
      subCategories: json['sub_categories'] as List<dynamic>? ?? [],
      brand: json['brand'] as int?,
      brandName: json['brand_name'] as String?,
      tags: (json['tags'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      price: json['price'] as String,
      discountPrice: json['discount_price'] as String?,
      effectivePrice: json['effective_price'] as String?,
      resellerMrpPrice: json['reseller_mrp_price'] as String?,
      deliveryChargeInsideDhaka: json['delivery_charge_inside_dhaka'] as String?,
      deliveryChargeOutsideDhaka:
          json['delivery_charge_outside_dhaka'] as String?,
      vat: json['vat'] as String? ?? '0',
      images: (json['images'] as List<dynamic>?)
              ?.map((e) => ProductImage.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      createdAt: json['created_at'] as String? ?? '',
    );
  }

  String get displayPrice => effectivePrice ?? discountPrice ?? price;
}

class Category {
  final int id;
  final String name;
  final List<SubCategory> subcategories;

  const Category({
    required this.id,
    required this.name,
    this.subcategories = const [],
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'] as int,
      name: json['name'] as String,
      subcategories: (json['subcategories'] as List<dynamic>?)
              ?.map((e) => SubCategory.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class SubCategory {
  final int id;
  final String name;

  const SubCategory({required this.id, required this.name});

  factory SubCategory.fromJson(Map<String, dynamic> json) {
    return SubCategory(
      id: json['id'] as int,
      name: json['name'] as String,
    );
  }
}

class Brand {
  final int id;
  final String name;

  const Brand({required this.id, required this.name});

  factory Brand.fromJson(Map<String, dynamic> json) {
    return Brand(
      id: json['id'] as int,
      name: json['name'] as String,
    );
  }
}

class Vendor {
  final int id;
  final int userId;
  final String userUsername;
  final String shopName;
  final String address;
  final String bannerImage;
  final String memberStatus;
  final bool paymentStatus;
  final String? vendorStatus;
  final String createdAt;
  final int productsCount;
  final int? ordersCount;

  const Vendor({
    required this.id,
    required this.userId,
    required this.userUsername,
    required this.shopName,
    required this.address,
    required this.bannerImage,
    required this.memberStatus,
    required this.paymentStatus,
    this.vendorStatus,
    required this.createdAt,
    required this.productsCount,
    this.ordersCount,
  });

  factory Vendor.fromJson(Map<String, dynamic> json) {
    return Vendor(
      id: json['id'] as int,
      userId: json['user_id'] as int? ?? json['user'] as int,
      userUsername: json['user_username'] as String? ?? '',
      shopName: json['shop_name'] as String,
      address: json['address'] as String? ?? '',
      bannerImage: json['banner_image'] as String? ?? '',
      memberStatus: json['member_status'] as String? ?? 'user',
      paymentStatus: json['payment_status'] as bool? ?? false,
      vendorStatus: json['vendor_status'] as String?,
      createdAt: json['created_at'] as String? ?? '',
      productsCount: json['products_count'] as int? ?? 0,
      ordersCount: json['orders_count'] as int?,
    );
  }
}

class ShopProductsResponse {
  final List<Product> results;
  final int count;
  final int page;
  final int pageSize;
  final int totalPages;

  const ShopProductsResponse({
    required this.results,
    required this.count,
    required this.page,
    required this.pageSize,
    required this.totalPages,
  });

  factory ShopProductsResponse.fromJson(Map<String, dynamic> json) {
    return ShopProductsResponse(
      results: (json['results'] as List<dynamic>)
          .map((e) => Product.fromJson(e as Map<String, dynamic>))
          .toList(),
      count: json['count'] as int,
      page: json['page'] as int,
      pageSize: json['page_size'] as int,
      totalPages: json['total_pages'] as int,
    );
  }
}
