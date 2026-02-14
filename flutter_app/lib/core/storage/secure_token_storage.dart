import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/api_constants.dart';

/// Secure storage for JWT tokens. Prefer this over shared_preferences for tokens.
class SecureTokenStorage {
  SecureTokenStorage({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage(
          aOptions: AndroidOptions(encryptedSharedPreferences: true),
        );

  final FlutterSecureStorage _storage;

  Future<String?> getAccessToken() =>
      _storage.read(key: StorageKeys.accessToken);

  Future<String?> getRefreshToken() =>
      _storage.read(key: StorageKeys.refreshToken);

  Future<void> saveTokens({required String access, required String refresh}) {
    return Future.wait([
      _storage.write(key: StorageKeys.accessToken, value: access),
      _storage.write(key: StorageKeys.refreshToken, value: refresh),
    ]);
  }

  Future<void> clearTokens() {
    return Future.wait([
      _storage.delete(key: StorageKeys.accessToken),
      _storage.delete(key: StorageKeys.refreshToken),
    ]);
  }
}
