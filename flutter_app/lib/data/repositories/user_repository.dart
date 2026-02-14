import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants/api_constants.dart';
import '../../core/di/app_providers.dart';
import '../../core/network/api_client.dart';
import '../models/user_models.dart';

final userRepositoryProvider = Provider<UserRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return UserRepository(client: client);
});

class UserRepository {
  const UserRepository({required ApiClient client}) : _client = client;
  final ApiClient _client;

  Future<UserInfo> getUserInfo() async {
    final response = await _client.dio.get<Map<String, dynamic>>(
      ApiEndpoints.userInfo,
    );
    return UserInfo.fromJson(response.data!);
  }

  Future<UserInfo> updateUserInfo(Map<String, dynamic> data) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      ApiEndpoints.userInfo,
      data: data,
    );
    return UserInfo.fromJson(response.data!);
  }
}
