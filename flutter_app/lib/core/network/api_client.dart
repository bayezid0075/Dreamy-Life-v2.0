import 'package:dio/dio.dart';

import '../constants/api_constants.dart';
import '../storage/secure_token_storage.dart';

/// Single Dio client with JWT attach + refresh-on-401 interceptor.
class ApiClient {
  ApiClient({
    required SecureTokenStorage tokenStorage,
    String baseUrl = kApiBaseUrl,
    Dio? dio,
  })  : _tokenStorage = tokenStorage,
        _dio = dio ?? Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
          sendTimeout: const Duration(seconds: 30),
          headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        )) {
    _dio.interceptors.addAll([
      _AuthInterceptor(_tokenStorage),
      _RefreshInterceptor(_dio, _tokenStorage, baseUrl),
      LogInterceptor(requestBody: true, responseBody: false),
    ]);
  }

  final SecureTokenStorage _tokenStorage;
  final Dio _dio;

  Dio get dio => _dio;
}

class _AuthInterceptor extends Interceptor {
  _AuthInterceptor(this._storage);
  final SecureTokenStorage _storage;

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.getAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
}

class _RefreshInterceptor extends QueuedInterceptor {
  _RefreshInterceptor(this._dio, this._storage, this._baseUrl);
  final Dio _dio;
  final SecureTokenStorage _storage;
  final String _baseUrl;

  @override
  void onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode != 401) {
      return handler.next(err);
    }
    final opts = err.requestOptions;
    if (opts.extra['_retry'] == true) {
      return handler.next(err);
    }
    final refresh = await _storage.getRefreshToken();
    if (refresh == null || refresh.isEmpty) {
      return handler.next(err);
    }
    try {
      final plainDio = Dio(BaseOptions(baseUrl: _baseUrl));
      final response = await plainDio.post<Map<String, dynamic>>(
        ApiEndpoints.tokenRefresh,
        data: {'refresh': refresh},
        options: Options(headers: {'Content-Type': 'application/json'}),
      );
      final access = response.data?['access'] as String?;
      if (access != null) {
        await _storage.saveTokens(access: access, refresh: refresh);
        opts.headers['Authorization'] = 'Bearer $access';
        opts.extra['_retry'] = true;
        final retry = await _dio.fetch(opts);
        return handler.resolve(retry);
      }
    } catch (_) {}
    handler.next(err);
  }
}
