import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants/api_constants.dart';
import '../../core/di/app_providers.dart';
import '../../core/network/api_client.dart';
import '../models/product_models.dart';

final shopRepositoryProvider = Provider<ShopRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return ShopRepository(client: client);
});

class ShopRepository {
  const ShopRepository({required ApiClient client}) : _client = client;
  final ApiClient _client;

  Future<ShopProductsResponse> getProducts({
    String? search,
    int? category,
    int? brand,
    int? vendor,
    double? minPrice,
    double? maxPrice,
    String? sortBy,
    int page = 1,
    int pageSize = 20,
  }) async {
    final query = <String, dynamic>{
      'page': page,
      'page_size': pageSize,
    };
    if (search != null && search.isNotEmpty) query['search'] = search;
    if (category != null) query['category'] = category;
    if (brand != null) query['brand'] = brand;
    if (vendor != null) query['vendor'] = vendor;
    if (minPrice != null) query['min_price'] = minPrice;
    if (maxPrice != null) query['max_price'] = maxPrice;
    if (sortBy != null) query['sort_by'] = sortBy;

    final response = await _client.dio.get<Map<String, dynamic>>(
      ApiEndpoints.shopProducts,
      queryParameters: query,
    );
    return ShopProductsResponse.fromJson(response.data!);
  }

  Future<Product> getProduct(int id) async {
    final response = await _client.dio.get<Map<String, dynamic>>(
      ApiEndpoints.shopProduct(id),
    );
    return Product.fromJson(response.data!);
  }

  Future<List<Category>> getCategories() async {
    final response = await _client.dio.get<List<dynamic>>(
      ApiEndpoints.shopCategories,
    );
    return (response.data ?? [])
        .map((e) => Category.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Brand>> getBrands() async {
    final response = await _client.dio.get<List<dynamic>>(
      ApiEndpoints.shopBrands,
    );
    return (response.data ?? [])
        .map((e) => Brand.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Vendor>> getVendors() async {
    final response = await _client.dio.get<List<dynamic>>(
      ApiEndpoints.shopVendors,
    );
    return (response.data ?? [])
        .map((e) => Vendor.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
