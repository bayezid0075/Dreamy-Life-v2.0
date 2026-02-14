import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/api_constants.dart';
import '../../../data/models/product_models.dart';
import '../../../data/repositories/shop_repository.dart';

final productDetailProvider =
    FutureProvider.autoDispose.family<Product, int>((ref, id) async {
  final repo = ref.watch(shopRepositoryProvider);
  return repo.getProduct(id);
});

class ProductDetailScreen extends ConsumerWidget {
  const ProductDetailScreen({super.key, required this.productId});
  final int productId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productAsync = ref.watch(productDetailProvider(productId));
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Product'),
      ),
      body: productAsync.when(
        data: (product) => SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (product.images.isNotEmpty)
                SizedBox(
                  height: 280,
                  child: PageView.builder(
                    itemCount: product.images.length,
                    itemBuilder: (_, i) => Image.network(
                      resolveMediaUrl(product.images[i].image),
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Icon(
                        Icons.image_not_supported,
                        size: 64,
                      ),
                    ),
                  ),
                )
              else
                const SizedBox(
                  height: 200,
                  child: Center(child: Icon(Icons.image_not_supported, size: 64)),
                ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.title,
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '৳${product.displayPrice}',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                    ),
                    if (product.description.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Text(
                        product.description,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
