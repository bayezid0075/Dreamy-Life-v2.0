import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../constants/api_constants.dart';
import '../network/api_client.dart';
import '../storage/secure_token_storage.dart';

/// On web (Chrome) use localhost; on Android emulator use 10.0.2.2; override with API_BASE_URL.
String get effectiveApiBaseUrl =>
    kIsWeb ? 'http://localhost:8000' : kApiBaseUrl;

final secureTokenStorageProvider = Provider<SecureTokenStorage>((ref) {
  return SecureTokenStorage();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureTokenStorageProvider);
  return ApiClient(tokenStorage: storage, baseUrl: effectiveApiBaseUrl);
});
