import 'package:flutter/material.dart';

import '../../../app/theme/app_theme.dart';

/// Card used on login/register – gradient icon, title, form, footer link.
class AuthCard extends StatelessWidget {
  const AuthCard({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    required this.form,
    required this.footer,
    required this.footerLinkLabel,
    required this.onFooterLink,
    this.error,
  });

  final IconData icon;
  final String title;
  final String description;
  final String? error;
  final Widget form;
  final String footer;
  final String footerLinkLabel;
  final VoidCallback onFooterLink;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: theme.brightness == Brightness.dark
            ? AppTheme.cardDark.withOpacity(0.95)
            : Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(AppTheme.radius),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRect(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 64,
                height: 64,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  gradient: AppTheme.primaryGradient,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.fuchsia600.withOpacity(0.4),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Icon(icon, size: 32, color: Colors.white),
              ),
            ),
            ShaderMask(
              blendMode: BlendMode.srcIn,
              shaderCallback: (bounds) => AppTheme.primaryGradient.createShader(bounds),
              child: Text(
                title,
                textAlign: TextAlign.center,
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              description,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodySmall,
            ),
            const SizedBox(height: 20),
            if (error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.errorContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  error!,
                  style: TextStyle(color: theme.colorScheme.onErrorContainer, fontSize: 13),
                ),
              ),
              const SizedBox(height: 16),
            ],
            form,
            const SizedBox(height: 16),
            Center(
              child: Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Text(footer, style: theme.textTheme.bodySmall),
                  GestureDetector(
                    onTap: onFooterLink,
                    child: Text(
                      footerLinkLabel,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Full-width gradient button (violet → fuchsia → pink).
class AuthGradientButton extends StatelessWidget {
  const AuthGradientButton({
    super.key,
    required this.onPressed,
    required this.loading,
    required this.label,
  });

  final VoidCallback? onPressed;
  final bool loading;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: onPressed != null ? AppTheme.primaryGradient : null,
        borderRadius: BorderRadius.circular(AppTheme.radius),
        boxShadow: onPressed != null
            ? [
                BoxShadow(
                  color: AppTheme.fuchsia600.withOpacity(0.25),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(AppTheme.radius),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 14),
            child: Center(
              child: loading
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(
                      label,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
