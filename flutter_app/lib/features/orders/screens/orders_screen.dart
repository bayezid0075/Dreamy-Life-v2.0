import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/order_models.dart';
import '../../../data/repositories/order_repository.dart';

final ordersListProvider = FutureProvider.autoDispose<List<Order>>((ref) {
  final repo = ref.watch(orderRepositoryProvider);
  return repo.getOrders();
});

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(ordersListProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Orders'),
        centerTitle: true,
      ),
      body: ordersAsync.when(
        data: (orders) {
          if (orders.isEmpty) {
            return const Center(
              child: Text('No orders yet'),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: orders.length,
            itemBuilder: (_, index) {
              final order = orders[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  title: Text('#${order.orderNumber}'),
                  subtitle: Text(
                    '${order.items.length} item(s) · ৳${order.totalAmount}',
                  ),
                  trailing: Chip(
                    label: Text(
                      order.orderStatus,
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
