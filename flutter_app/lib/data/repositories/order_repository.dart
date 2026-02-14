import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants/api_constants.dart';
import '../../core/di/app_providers.dart';
import '../../core/network/api_client.dart';
import '../models/order_models.dart';

final orderRepositoryProvider = Provider<OrderRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return OrderRepository(client: client);
});

class OrderRepository {
  const OrderRepository({required ApiClient client}) : _client = client;
  final ApiClient _client;

  Future<Order> createOrder(OrderCreatePayload payload) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      ApiEndpoints.orders,
      data: payload.toJson(),
    );
    return Order.fromJson(response.data!);
  }

  Future<List<Order>> getOrders() async {
    final response = await _client.dio.get<List<dynamic>>(
      ApiEndpoints.ordersList,
    );
    return (response.data ?? [])
        .map((e) => Order.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Order> getOrder(int id) async {
    final response = await _client.dio.get<Map<String, dynamic>>(
      ApiEndpoints.order(id),
    );
    return Order.fromJson(response.data!);
  }
}
