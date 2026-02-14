import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/api_constants.dart';
import '../../../data/models/product_models.dart';
import '../../../data/repositories/shop_repository.dart';

final shopProductsProvider = FutureProvider.autoDispose<ShopProductsResponse>((ref) {
  final repo = ref.watch(shopRepositoryProvider);
  return repo.getProducts(pageSize: 20);
});

class ShopScreen extends ConsumerWidget {
  const ShopScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(shopProductsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shop'),
        centerTitle: true,
      ),
      body: productsAsync.when(
        data: (data) {
          if (data.results.isEmpty) {
            return const Center(child: Text('No products yet'));
          }
          return GridView.builder(
            padding: const EdgeInsets.all(12),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.72,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: data.results.length,
            itemBuilder: (context, index) {
              final product = data.results[index];
              return _ProductCard(product: product);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final imageUrl = product.images.isNotEmpty
        ? product.images.first.image
        : null;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/dashboard/product/${product.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: imageUrl != null
                  ? Image.network(
                      resolveMediaUrl(imageUrl),
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Icon(
                        Icons.image_not_supported,
                        size: 48,
                      ),
                    )
                  : const Icon(Icons.image_not_supported, size: 48),
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '৳${product.displayPrice}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
