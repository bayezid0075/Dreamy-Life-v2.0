/// API base URL. Use your machine's IP (e.g. 192.168.1.x) for physical device;
/// use 10.0.2.2 for Android emulator to reach host localhost.
const String kApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:8000',
);

class ApiEndpoints {
  ApiEndpoints._();

  static const String tokenRefresh = '/api/token/refresh/';
  static const String login = '/api/users/login/';
  static const String register = '/api/users/register/';
  static const String userInfo = '/api/users/userinfo/';
  static const String accountStatus = '/api/users/account-status/';
  static const String downlines = '/api/users/downlines/';

  static const String wallet = '/api/wallets/';
  static const String funds = '/api/wallets/funds/';
  static const String points = '/api/wallets/points/';

  static const String memberships = '/api/memberships/';
  static const String membershipPurchase = '/api/memberships/purchase/';
  static const String paymentCreate = '/api/memberships/payment/create/';
  static const String paymentVerify = '/api/memberships/payment/verify/';

  static const String shopProducts = '/api/vendors/shop/products/';
  static String shopProduct(int id) => '/api/vendors/shop/products/$id/';
  static const String shopCategories = '/api/vendors/shop/categories/';
  static const String shopBrands = '/api/vendors/shop/brands/';
  static const String shopVendors = '/api/vendors/shop/vendors/';

  static const String orders = '/api/vendors/orders/';
  static const String ordersList = '/api/vendors/orders/list/';
  static String order(int id) => '/api/vendors/orders/$id/';

  static const String vendors = '/api/vendors/vendors/';
  static String vendor(int id) => '/api/vendors/vendors/$id/';
  static const String vendorOrders = '/api/vendors/vendors/orders/';
  static String vendorOrder(int id) => '/api/vendors/vendors/orders/$id/';
  static const String vendorProducts = '/api/vendors/products/';
  static String vendorProduct(int id) => '/api/vendors/products/$id/';

  static const String notifications = '/api/notifications/';
  static const String notificationsUnreadCount = '/api/notifications/unread-count/';
  static String notificationMarkRead(int id) => '/api/notifications/$id/mark-read/';
  static const String notificationsMarkAllRead = '/api/notifications/mark-all-read/';
}

class StorageKeys {
  StorageKeys._();
  static const String accessToken = 'access_token';
  static const String refreshToken = 'refresh_token';
}

/// Resolve media URL: if [url] is relative (e.g. /media/...), prepend [kApiBaseUrl].
String resolveMediaUrl(String url) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  final base = kApiBaseUrl.endsWith('/') ? kApiBaseUrl : '$kApiBaseUrl/';
  final path = url.startsWith('/') ? url.substring(1) : url;
  return base + path;
}
