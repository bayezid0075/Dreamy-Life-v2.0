import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants/api_constants.dart';
import '../../core/di/app_providers.dart';
import '../../core/network/api_client.dart';
import '../models/notification_models.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return NotificationRepository(client: client);
});

class NotificationRepository {
  const NotificationRepository({required ApiClient client}) : _client = client;
  final ApiClient _client;

  Future<List<AppNotification>> getList() async {
    final response = await _client.dio.get<List<dynamic>>(ApiEndpoints.notifications);
    return (response.data ?? [])
        .map((e) => AppNotification.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<int> getUnreadCount() async {
    final response = await _client.dio.get<Map<String, dynamic>>(
      ApiEndpoints.notificationsUnreadCount,
    );
    return (response.data?['count'] as int?) ?? 0;
  }

  Future<AppNotification> markRead(int id) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      ApiEndpoints.notificationMarkRead(id),
    );
    return AppNotification.fromJson(response.data!);
  }

  Future<int> markAllRead() async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      ApiEndpoints.notificationsMarkAllRead,
    );
    return (response.data?['marked'] as int?) ?? 0;
  }
}
