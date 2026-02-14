import 'package:dio/dio.dart';

/// Returns a user-friendly message for DioException (timeout, no connection, server error).
String messageFromDioException(DioException e, {String fallback = 'Something went wrong'}) {
  switch (e.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      return 'Could not reach the server. Check that:\n'
          '• Backend is running (e.g. python manage.py runserver)\n'
          '• On emulator: use 10.0.2.2:8000\n'
          '• On device: use your PC IP (e.g. 192.168.1.x:8000)';
    case DioExceptionType.connectionError:
      return 'No connection to server. Start the backend and check the API URL.';
    case DioExceptionType.unknown:
      if (e.error?.toString().contains('SocketException') == true ||
          e.error?.toString().toLowerCase().contains('connection') == true) {
        return 'Cannot connect to server. Is the backend running?';
      }
      break;
    default:
      break;
  }
  if (e.response?.data is Map) {
    final detail = (e.response!.data as Map)['detail'];
    if (detail != null) return detail.toString();
  }
  return fallback;
}
