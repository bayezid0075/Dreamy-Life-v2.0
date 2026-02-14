import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/wallet_models.dart';
import '../../../data/repositories/wallet_repository.dart';

final walletProvider = FutureProvider.autoDispose<Wallet>((ref) {
  final repo = ref.watch(walletRepositoryProvider);
  return repo.getWallet();
});

class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final walletAsync = ref.watch(walletProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Wallet'),
        centerTitle: true,
      ),
      body: walletAsync.when(
        data: (wallet) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Text(
                        'Balance',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '৳${wallet.balance}',
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          _Stat(label: 'Income', value: wallet.income),
                          _Stat(label: 'Expense', value: wallet.expense),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Recent',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              if (wallet.transactions.isEmpty)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Center(child: Text('No transactions yet')),
                  ),
                )
              else
                ...wallet.transactions.take(10).map(
                      (t) => ListTile(
                        title: Text(t.description),
                        subtitle: Text(t.createdAt),
                        trailing: Text(
                          '${t.transactionType == "credit" ? "+" : "-"}৳${t.amount}',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: t.transactionType == "credit"
                                ? Colors.green
                                : Colors.red,
                          ),
                        ),
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

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(label, style: Theme.of(context).textTheme.bodySmall),
        Text('৳$value', style: Theme.of(context).textTheme.titleSmall),
      ],
    );
  }
}
