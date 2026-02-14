import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/orders/screens/orders_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/shop/screens/shop_screen.dart';
import '../../features/wallet/screens/wallet_screen.dart';

class DashboardShell extends ConsumerStatefulWidget {
  const DashboardShell({super.key, required this.matchedLocation});
  final String matchedLocation;

  @override
  ConsumerState<DashboardShell> createState() => _DashboardShellState();
}

class _DashboardShellState extends ConsumerState<DashboardShell> {
  static const _tabs = [
    _TabItem(icon: Icons.store, label: 'Shop', path: '/dashboard/shop'),
    _TabItem(icon: Icons.receipt_long, label: 'Orders', path: '/dashboard/orders'),
    _TabItem(icon: Icons.notifications, label: 'Notifications', path: '/dashboard/notifications'),
    _TabItem(icon: Icons.account_balance_wallet, label: 'Wallet', path: '/dashboard/wallet'),
    _TabItem(icon: Icons.person, label: 'Profile', path: '/dashboard/profile'),
  ];

  int _currentIndex() {
    final path = widget.matchedLocation;
    final i = _tabs.indexWhere((t) => path == t.path || path.startsWith('${t.path}/'));
    return i >= 0 ? i : 0;
  }

  Widget _buildNavBar(BuildContext context, int index) {
    final unreadAsync = ref.watch(notificationsUnreadCountProvider);
    final unreadCount = unreadAsync.valueOrNull ?? 0;
    const notifTabIndex = 2; // Notifications is 3rd tab
    return NavigationBar(
      selectedIndex: index,
      onDestinationSelected: (i) => context.go(_tabs[i].path),
      destinations: [
        for (int i = 0; i < _tabs.length; i++)
          NavigationDestination(
            icon: i == notifTabIndex && unreadCount > 0
                ? Badge(
                    label: Text(unreadCount > 99 ? '99+' : '$unreadCount'),
                    child: Icon(_tabs[i].icon),
                  )
                : Icon(_tabs[i].icon),
            label: _tabs[i].label,
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final index = _currentIndex();
    return Scaffold(
      body: IndexedStack(
        index: index,
        children: const [
          ShopScreen(),
          OrdersScreen(),
          NotificationsScreen(),
          WalletScreen(),
          ProfileScreen(),
        ],
      ),
      bottomNavigationBar: _buildNavBar(context, index),
    );
  }
}

class _TabItem {
  const _TabItem({
    required this.icon,
    required this.label,
    required this.path,
  });
  final IconData icon;
  final String label;
  final String path;
}
