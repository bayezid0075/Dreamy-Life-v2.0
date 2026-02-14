import 'package:flutter/material.dart';

/// Dreamy Life app theme – matches website (violet / fuchsia / pink gradient).
class AppTheme {
  AppTheme._();

  static const Color violet600 = Color(0xFF7C3AED);
  static const Color violet700 = Color(0xFF6D28D9);
  static const Color fuchsia600 = Color(0xFFC026D3);
  static const Color fuchsia700 = Color(0xFFA21CAF);
  static const Color pink500 = Color(0xFFEC4899);
  static const Color pink600 = Color(0xFFDB2777);

  static const Color cardLight = Color(0xFFF2F2F2); // white/95
  static const Color cardDark = Color(0xFF1E293B); // slate-900/95

  static const double radius = 12; // 0.75rem

  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: const ColorScheme.light(
        primary: violet600,
        onPrimary: Colors.white,
        primaryContainer: Color(0xFFEDE9FE),
        onPrimaryContainer: violet700,
        secondary: fuchsia600,
        onSecondary: Colors.white,
        surface: Colors.white,
        onSurface: Color(0xFF1E293B),
        surfaceContainerHighest: cardLight,
        outline: Color(0xFFE2E8F0),
        error: Color(0xFFDC2626),
        onError: Colors.white,
      ),
      scaffoldBackgroundColor: const Color(0xFFF8FAFC),
      cardTheme: CardThemeData(
        color: cardLight,
        elevation: 0,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius)),
        clipBehavior: Clip.antiAlias,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(radius)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: violet600, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: Color(0xFFDC2626)),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        labelStyle: const TextStyle(color: Color(0xFF64748B)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: violet600,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(radius)),
          elevation: 0,
        ),
      ),
      textTheme: _textTheme,
    );
  }

  static ThemeData get dark {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: const ColorScheme.dark(
        primary: Color(0xFFA78BFA),
        onPrimary: Color(0xFF1E1B4B),
        primaryContainer: Color(0xFF4C1D95),
        onPrimaryContainer: Color(0xFFEDE9FE),
        secondary: Color(0xFFE879F9),
        onSecondary: Color(0xFF3B0764),
        surface: Color(0xFF0F172A),
        onSurface: Color(0xFFF1F5F9),
        surfaceContainerHighest: cardDark,
        outline: Color(0xFF334155),
        error: Color(0xFFF87171),
        onError: Color(0xFF450A0A),
      ),
      scaffoldBackgroundColor: const Color(0xFF0F172A),
      cardTheme: CardThemeData(
        color: cardDark,
        elevation: 0,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius)),
        clipBehavior: Clip.antiAlias,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF334155),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(radius)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: Color(0xFF475569)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: Color(0xFFA78BFA), width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: Color(0xFFF87171)),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: violet600,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(radius)),
          elevation: 0,
        ),
      ),
      textTheme: _textTheme.apply(
          bodyColor: const Color(0xFFF1F5F9),
          displayColor: const Color(0xFFF1F5F9)),
    );
  }

  static const TextTheme _textTheme = TextTheme(
    headlineMedium: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
    titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
    bodyMedium: TextStyle(fontSize: 14),
    bodySmall: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
  );

  /// Gradient for primary buttons and icon box (violet → fuchsia → pink).
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [violet600, fuchsia600, pink500],
  );

  static const LinearGradient primaryGradientHover = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [violet700, fuchsia700, pink600],
  );
}
