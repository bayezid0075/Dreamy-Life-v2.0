import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/user_models.dart';
import '../../../data/repositories/auth_repository.dart';
import '../../../data/repositories/user_repository.dart';

/// Bump this to invalidate auth-related caches (login/logout).
final authVersionProvider = StateProvider<int>((ref) => 0);

/// Whether the user has valid tokens (persisted). Does not fetch user info.
final isLoggedInProvider = FutureProvider<bool>((ref) async {
  ref.watch(authVersionProvider);
  final repo = ref.watch(authRepositoryProvider);
  return repo.hasTokens();
});

/// Current user info. Invalidated on logout; refetched when needed.
final currentUserProvider =
    FutureProvider.autoDispose<UserInfo?>((ref) async {
  final isLoggedIn = await ref.watch(isLoggedInProvider.future);
  if (!isLoggedIn) return null;
  try {
    final userRepo = ref.watch(userRepositoryProvider);
    return await userRepo.getUserInfo();
  } catch (_) {
    return null;
  }
});

/// Sync wrapper for navigation: treat as logged in only when we have user info.
final authStateProvider = Provider<AsyncValue<UserInfo?>>((ref) {
  return ref.watch(currentUserProvider);
});

/// Call after login (tokens saved) or logout (tokens cleared) to refresh auth state.
void invalidateAuth(WidgetRef ref) {
  ref.read(authVersionProvider.notifier).state++;
}
