import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/constants/api_constants.dart';
import '../../../data/models/notification_models.dart';
import '../../../data/repositories/notification_repository.dart';

final notificationsListProvider =
    FutureProvider.autoDispose<List<AppNotification>>((ref) {
  final repo = ref.watch(notificationRepositoryProvider);
  return repo.getList();
});

final notificationsUnreadCountProvider = FutureProvider.autoDispose<int>((ref) {
  final repo = ref.watch(notificationRepositoryProvider);
  return repo.getUnreadCount();
});

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listAsync = ref.watch(notificationsListProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        centerTitle: true,
        actions: [
          listAsync.when(
            data: (list) {
              final hasUnread = list.any((n) => !n.isRead);
              if (!hasUnread) return const SizedBox.shrink();
              return TextButton(
                onPressed: () async {
                  await ref.read(notificationRepositoryProvider).markAllRead();
                  ref.invalidate(notificationsListProvider);
                  ref.invalidate(notificationsUnreadCountProvider);
                },
                child: const Text('Mark all read'),
              );
            },
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
        ],
      ),
      body: listAsync.when(
        data: (list) {
          if (list.isEmpty) {
            return const Center(
              child: Text('No notifications'),
            );
          }
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(notificationsListProvider);
              ref.invalidate(notificationsUnreadCountProvider);
            },
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: list.length,
              itemBuilder: (context, index) {
                final n = list[index];
                return _NotificationTile(
                  notification: n,
                  onTap: () async {
                    if (!n.isRead) {
                      await ref
                          .read(notificationRepositoryProvider)
                          .markRead(n.id);
                      ref.invalidate(notificationsListProvider);
                      ref.invalidate(notificationsUnreadCountProvider);
                    }
                    if (n.link != null && n.link!.isNotEmpty && context.mounted) {
                      // Could launch URL with url_launcher
                    }
                  },
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({
    required this.notification,
    required this.onTap,
  });

  final AppNotification notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    String timeStr;
    try {
      timeStr = DateFormat.yMMMd().add_jm().format(DateTime.parse(notification.createdAt));
    } catch (_) {
      timeStr = notification.createdAt;
    }
    return Material(
      color: notification.isRead ? null : theme.colorScheme.surfaceContainerHighest,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (notification.image != null && notification.image!.isNotEmpty) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    resolveMediaUrl(notification.image!),
                    width: 56,
                    height: 56,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(Icons.image_not_supported, size: 56),
                  ),
                ),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      notification.title,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: notification.isRead ? FontWeight.normal : FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      notification.message,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      timeStr,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.outline,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
