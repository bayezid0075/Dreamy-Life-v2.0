import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/dio_error_helper.dart';
import '../../../data/models/user_models.dart';
import '../../../data/repositories/auth_repository.dart';
import '../providers/auth_state_provider.dart';
import '../widgets/auth_card.dart';
import '../widgets/auth_layout.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _error = null;
      _loading = true;
    });
    final identifier = _identifierController.text.trim();
    final password = _passwordController.text;
    if (identifier.isEmpty || password.isEmpty) {
      setState(() {
        _loading = false;
        _error = 'Email or phone and password are required';
      });
      return;
    }
    try {
      final authRepo = ref.read(authRepositoryProvider);
      final isEmail = identifier.contains('@');
      final credentials = isEmail
          ? LoginCredentials(email: identifier, password: password)
          : LoginCredentials(phone: identifier, password: password);
      final tokens = await authRepo.login(credentials);
      await authRepo.saveTokens(tokens);
      invalidateAuth(ref);
      if (mounted) context.go('/dashboard/shop');
    } on DioException catch (e) {
      final msg = messageFromDioException(e, fallback: 'Login failed');
      if (mounted) setState(() { _error = msg; _loading = false; });
    } catch (_) {
      if (mounted) setState(() { _error = 'Something went wrong'; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthLayout(
      child: AuthCard(
        icon: Icons.person_outline,
        title: 'Welcome Back',
        description: 'Enter your credentials to access your account',
        error: _error,
        form: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _identifierController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Email or Phone',
                  hintText: 'Enter your email or phone',
                  prefixIcon: Icon(Icons.email_outlined),
                ),
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: InputDecoration(
                  labelText: 'Password',
                  hintText: 'Enter your password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
                validator: (v) => v == null || v.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () {}, // Forgot password – add route later
                  child: const Text('Forgot password?'),
                ),
              ),
              const SizedBox(height: 8),
              AuthGradientButton(
                onPressed: _loading ? null : _submit,
                loading: _loading,
                label: 'Sign In',
              ),
            ],
          ),
        ),
        footer: 'Don\'t have an account? ',
        footerLinkLabel: 'Sign up',
        onFooterLink: () => context.push('/register'),
      ),
    );
  }
}
