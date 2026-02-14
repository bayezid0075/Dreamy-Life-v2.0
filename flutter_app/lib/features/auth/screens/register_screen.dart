import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/dio_error_helper.dart';
import '../../../data/models/user_models.dart';
import '../../../data/repositories/auth_repository.dart';
import '../widgets/auth_card.dart';
import '../widgets/auth_layout.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _referredByController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _referredByController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    _error = null;
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final password = _passwordController.text;
    final confirm = _confirmPasswordController.text;
    if (password != confirm) {
      setState(() => _error = "Passwords don't match");
      return;
    }
    setState(() => _loading = true);
    try {
      final authRepo = ref.read(authRepositoryProvider);
      final referredBy = _referredByController.text.trim();
      await authRepo.register(RegisterData(
        username: _usernameController.text.trim(),
        email: _emailController.text.trim(),
        phoneNumber: _phoneController.text.trim(),
        password: password,
        referredBy: referredBy.isEmpty ? null : referredBy,
      ));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Account created successfully! Please login.')),
        );
        context.go('/login');
      }
    } on DioException catch (e) {
      String msg = messageFromDioException(e, fallback: 'Registration failed');
      if (e.response?.data is Map) {
        final data = e.response!.data as Map;
        if (data['email'] is List && (data['email'] as List).isNotEmpty) {
          msg = (data['email'] as List).first.toString();
        } else if (data['phone_number'] is List && (data['phone_number'] as List).isNotEmpty) {
          msg = (data['phone_number'] as List).first.toString();
        } else if (data['detail'] != null) {
          msg = data['detail'].toString();
        }
      }
      if (mounted) setState(() { _error = msg; _loading = false; });
    } catch (_) {
      if (mounted) setState(() { _error = 'Something went wrong'; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthLayout(
      child: AuthCard(
        icon: Icons.person_add_outlined,
        title: 'Create an Account',
        description: 'Enter your details to get started',
        error: _error,
        form: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _usernameController,
                decoration: const InputDecoration(
                  labelText: 'Username',
                  hintText: 'Enter your username',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                validator: (v) => v == null || v.trim().isEmpty ? 'Username is required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  hintText: 'Enter your email',
                  prefixIcon: Icon(Icons.email_outlined),
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Email is required';
                  if (!v.contains('@') || !v.contains('.')) return 'Invalid email address';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  hintText: 'Enter your phone number',
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
                validator: (v) => v == null || v.trim().isEmpty ? 'Phone number is required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: InputDecoration(
                  labelText: 'Password',
                  hintText: 'Create a password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Password is required';
                  if (v.length < 8) return 'Password must be at least 8 characters';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _confirmPasswordController,
                obscureText: _obscureConfirm,
                decoration: InputDecoration(
                  labelText: 'Confirm Password',
                  hintText: 'Confirm your password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(_obscureConfirm ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                  ),
                ),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Please confirm your password';
                  if (v != _passwordController.text) return "Passwords don't match";
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _referredByController,
                decoration: const InputDecoration(
                  labelText: 'Referral Code (Optional)',
                  hintText: 'Enter referral code',
                  prefixIcon: Icon(Icons.card_giftcard_outlined),
                ),
              ),
              const SizedBox(height: 20),
              AuthGradientButton(
                onPressed: _loading ? null : _submit,
                loading: _loading,
                label: 'Create Account',
              ),
            ],
          ),
        ),
        footer: 'Already have an account? ',
        footerLinkLabel: 'Sign in',
        onFooterLink: () => context.go('/login'),
      ),
    );
  }
}
