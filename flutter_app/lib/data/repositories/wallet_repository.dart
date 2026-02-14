import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants/api_constants.dart';
import '../../core/di/app_providers.dart';
import '../../core/network/api_client.dart';
import '../models/wallet_models.dart';

final walletRepositoryProvider = Provider<WalletRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return WalletRepository(client: client);
});

class WalletRepository {
  const WalletRepository({required ApiClient client}) : _client = client;
  final ApiClient _client;

  Future<Wallet> getWallet() async {
    final response = await _client.dio.get<Map<String, dynamic>>(
      ApiEndpoints.wallet,
    );
    return Wallet.fromJson(response.data!);
  }

  Future<Funds> getFunds() async {
    final response = await _client.dio.get<Map<String, dynamic>>(
      ApiEndpoints.funds,
    );
    return Funds.fromJson(response.data!);
  }

  Future<Points> getPoints() async {
    final response = await _client.dio.get<Map<String, dynamic>>(
      ApiEndpoints.points,
    );
    return Points.fromJson(response.data!);
  }
}
