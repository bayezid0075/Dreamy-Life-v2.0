import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/providers/auth_state_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/orders/screens/orders_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/shop/screens/product_detail_screen.dart';
import '../../features/shop/screens/shop_screen.dart';
import '../../features/wallet/screens/wallet_screen.dart';
import '../screens/splash_screen.dart';
import 'dashboard_shell.dart';

final goRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final auth = ref.read(authStateProvider);
      final isSplash = state.matchedLocation == '/';
      final isLogin = state.matchedLocation == '/login';
      final isRegister = state.matchedLocation == '/register';
      final isAuthRoute = isLogin || isRegister;

      if (isSplash) return null;

      return auth.when(
        data: (user) {
          if (user != null && isAuthRoute) return '/dashboard/shop';
          if (user == null && !isAuthRoute) return '/login';
          if (state.matchedLocation == '/dashboard') return '/dashboard/shop';
          return null;
        },
        loading: () => isAuthRoute ? null : '/',
        error: (_, __) => isAuthRoute ? null : '/login',
      );
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (_, __) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (_, __) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (_, state) => DashboardShell(matchedLocation: state.matchedLocation),
        routes: [
          GoRoute(path: 'shop', builder: (_, __) => const ShopScreen()),
          GoRoute(path: 'orders', builder: (_, __) => const OrdersScreen()),
          GoRoute(path: 'notifications', builder: (_, __) => const NotificationsScreen()),
          GoRoute(path: 'wallet', builder: (_, __) => const WalletScreen()),
          GoRoute(path: 'profile', builder: (_, __) => const ProfileScreen()),
          GoRoute(
            path: 'product/:id',
            builder: (_, state) {
              final id = int.tryParse(state.pathParameters['id'] ?? '0') ?? 0;
              return ProductDetailScreen(productId: id);
            },
          ),
        ],
      ),
    ],
  );
});
