import 'package:flutter/material.dart';

import '../../../app/theme/app_theme.dart';

/// Wraps auth screens with website-style gradient background, header, and footer.
class AuthLayout extends StatelessWidget {
  const AuthLayout({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Gradient background (violet → fuchsia → pink)
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppTheme.violet600,
                    AppTheme.fuchsia600,
                    AppTheme.pink500,
                  ],
                ),
              ),
            ),
          ),
          // Floating blur shapes
          const Positioned(
              top: 80, left: 40, child: _BlurCircle(radius: 108, opacity: 0.1)),
          const Positioned(
              bottom: 80,
              right: 40,
              child: _BlurCircle(radius: 144, opacity: 0.08)),
          Positioned(
              top: MediaQuery.sizeOf(context).height * 0.4,
              left: MediaQuery.sizeOf(context).width * 0.25,
              child: const _BlurCircle(radius: 96, opacity: 0.06)),
          // Grid overlay
          Positioned.fill(
            child: CustomPaint(
              painter: _GridPainter(
                  color: Colors.white.withOpacity(0.03), cellSize: 50),
            ),
          ),
          // Content
          SafeArea(
            child: Column(
              children: [
                _AuthHeader(),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 400),
                        child: child,
                      ),
                    ),
                  ),
                ),
                _AuthFooter(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BlurCircle extends StatelessWidget {
  const _BlurCircle({required this.radius, required this.opacity});

  final double radius;
  final double opacity;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: radius * 2,
      height: radius * 2,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white.withOpacity(opacity),
        boxShadow: [
          BoxShadow(
            blurRadius: 60,
            spreadRadius: 20,
            color: Colors.white.withOpacity(opacity * 0.5),
          ),
        ],
      ),
    );
  }
}

class _GridPainter extends CustomPainter {
  _GridPainter({required this.color, required this.cellSize});

  final Color color;
  final double cellSize;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1;
    for (double x = 0; x <= size.width; x += cellSize) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y <= size.height; y += cellSize) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _AuthHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Center(
              child: Text(
                'DL',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          const Text(
            'Dreamy Life',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 20,
              shadows: [
                Shadow(
                    color: Colors.black26, offset: Offset(0, 1), blurRadius: 2),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AuthFooter extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Text(
        '© ${DateTime.now().year} Dreamy Life. All rights reserved.',
        style: TextStyle(
          fontSize: 12,
          color: Colors.white.withOpacity(0.7),
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}
