import 'package:flutter/material.dart';

/// Central design-system tokens for the Crisis Logistics app.
///
/// Industrial dark theme — clean lines, high information density,
/// designed for professional logistics dashboards, not chat apps.
class AppTheme {
  AppTheme._();

  // ─── Colour Palette ──────────────────────────────────────────────────
  static const Color background = Color(0xFF101216);
  static const Color surface = Color(0xFF181B22);
  static const Color surfaceAlt = Color(0xFF1F232D);
  static const Color card = Color(0xFF181B22);

  static const Color primary = Color(0xFF4E8CFF);
  static const Color primaryMuted = Color(0xFF3A6BD4);
  static const Color accent = Color(0xFF2EDBA3);

  static const Color caution = Color(0xFFE8A838);
  static const Color cautionBg = Color(0x1AE8A838);
  static const Color danger = Color(0xFFE85454);
  static const Color success = Color(0xFF38C976);

  static const Color textHigh = Color(0xFFEBEDF2);
  static const Color textMid = Color(0xFF8D94A8);
  static const Color textLow = Color(0xFF555D73);

  static const Color border = Color(0xFF262B38);
  static const Color borderFocus = Color(0xFF4E8CFF);

  // ─── Radius ──────────────────────────────────────────────────────────
  static const double r4 = 4;
  static const double r6 = 6;
  static const double r8 = 8;
  static const double r12 = 12;

  // ─── ThemeData ───────────────────────────────────────────────────────
  static ThemeData get dark {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      colorScheme: const ColorScheme.dark(
        primary: primary,
        secondary: caution,
        error: danger,
        surface: surface,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: background,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        foregroundColor: textHigh,
        titleTextStyle: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: textHigh,
          letterSpacing: -0.2,
        ),
      ),
      dividerTheme: const DividerThemeData(color: border, thickness: 1),
      chipTheme: ChipThemeData(
        backgroundColor: surfaceAlt,
        labelStyle: const TextStyle(
          color: primary,
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
        side: const BorderSide(color: border),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(r4),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(r6),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.3,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: textMid,
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceAlt,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(r6),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(r6),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(r6),
          borderSide: const BorderSide(color: borderFocus, width: 1.5),
        ),
        labelStyle: const TextStyle(color: textMid, fontSize: 15),
        hintStyle: const TextStyle(color: textLow, fontSize: 15),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(r12)),
        ),
      ),
    );
  }
}
