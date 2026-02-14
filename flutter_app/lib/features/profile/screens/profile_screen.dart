import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../data/repositories/auth_repository.dart';
import '../../auth/providers/auth_state_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(currentUserProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        centerTitle: true,
      ),
      body: userAsync.when(
        data: (user) {
          if (user == null) {
            return const Center(child: Text('Not logged in'));
          }
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                const SizedBox(height: 16),
                CircleAvatar(
                  radius: 48,
                  backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                  child: Text(
                    user.user.username.isNotEmpty
                        ? user.user.username[0].toUpperCase()
                        : '?',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          color: Theme.of(context).colorScheme.onPrimaryContainer,
                        ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  user.user.username,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                Text(
                  user.user.email,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
                if (user.ownRefercode.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Chip(label: Text('Referral: ${user.ownRefercode}')),
                ],
                const SizedBox(height: 24),
                ListTile(
                  leading: const Icon(Icons.logout),
                  title: const Text('Sign out'),
                  onTap: () async {
                    await ref.read(authRepositoryProvider).logout();
                    invalidateAuth(ref);
                    if (context.mounted) context.go('/login');
                  },
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
