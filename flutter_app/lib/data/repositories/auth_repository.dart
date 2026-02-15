import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants/api_constants.dart';
import '../../core/di/app_providers.dart';
import '../../core/network/api_client.dart';
import '../../core/storage/secure_token_storage.dart';
import '../models/user_models.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  final storage = ref.watch(secureTokenStorageProvider);
  return AuthRepository(client: client, tokenStorage: storage);
});

class AuthRepository {
  const AuthRepository({
    required ApiClient client,
    required SecureTokenStorage tokenStorage,
  })  : _client = client,
        _storage = tokenStorage;

  final ApiClient _client;
  final SecureTokenStorage _storage;

  Future<AuthTokens> login(LoginCredentials credentials) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      ApiEndpoints.login,
      data: credentials.toJson(),
    );
    final data = response.data;
    if (data == null) {
      throw const FormatException('Invalid login response: empty body');
    }
    return AuthTokens.fromJson(data);
  }

  Future<Map<String, dynamic>> register(RegisterData data) async {
    final response = await _client.dio.post<Map<String, dynamic>>(
      ApiEndpoints.register,
      data: data.toJson(),
    );
    return response.data!;
  }

  Future<void> saveTokens(AuthTokens tokens) {
    return _storage.saveTokens(
      access: tokens.access,
      refresh: tokens.refresh,
    );
  }

  Future<void> logout() => _storage.clearTokens();

  Future<bool> hasTokens() async {
    final access = await _storage.getAccessToken();
    return access != null && access.isNotEmpty;
  }
}
