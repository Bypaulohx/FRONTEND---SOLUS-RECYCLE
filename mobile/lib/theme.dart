import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Design system Solus Recycle — espelha frontend/src/index.css.
class Solus {
  static const green = Color(0xFF38C958);
  static const greenDark = Color(0xFF149C68);
  static const greenSoft = Color(0xFFEAF8EE);
  static const ink = Color(0xFF313131);
  static const muted = Color(0xFF666666);
  static const inactive = Color(0xFFADADAD);
  static const border = Color(0xFFF1F1F1);
  static const surface = Color(0xFFFFFFFF);
  static const danger = Color(0xFFFE3C3C);
  static const canvas = Color(0xFFF7F8F8);
  static const radius = 10.0;
  static const headerHeight = 64.0;
  static const navHeight = 68.0;
  static const appWidth = 430.0;

  static TextTheme get textTheme {
    TextStyle mont({
      required double size,
      required FontWeight weight,
      required Color color,
    }) =>
        GoogleFonts.montserrat(fontSize: size, fontWeight: weight, color: color);

    return TextTheme(
      displayLarge: mont(size: 24, weight: FontWeight.w700, color: ink),
      headlineLarge: mont(size: 24, weight: FontWeight.w700, color: ink),
      headlineMedium: mont(size: 20, weight: FontWeight.w700, color: ink),
      titleLarge: mont(size: 18, weight: FontWeight.w700, color: ink),
      titleMedium: mont(size: 15, weight: FontWeight.w700, color: ink),
      titleSmall: mont(size: 13, weight: FontWeight.w700, color: ink),
      bodyLarge: mont(size: 16, weight: FontWeight.w400, color: ink),
      bodyMedium: mont(size: 14, weight: FontWeight.w400, color: ink),
      bodySmall: mont(size: 12, weight: FontWeight.w400, color: muted),
      labelLarge: mont(size: 16, weight: FontWeight.w700, color: Colors.white),
      labelMedium: mont(size: 12, weight: FontWeight.w600, color: ink),
      labelSmall: mont(size: 11, weight: FontWeight.w600, color: muted),
    );
  }

  static ThemeData get theme => ThemeData(
        useMaterial3: true,
        fontFamily: GoogleFonts.montserrat().fontFamily,
        textTheme: textTheme,
        scaffoldBackgroundColor: surface,
        colorScheme: ColorScheme.fromSeed(
          seedColor: green,
          primary: green,
          secondary: greenDark,
          error: danger,
          surface: surface,
          onPrimary: Colors.white,
          onSurface: ink,
        ),
        splashFactory: NoSplash.splashFactory,
        appBarTheme: const AppBarTheme(
          backgroundColor: surface,
          foregroundColor: ink,
          elevation: 0,
          surfaceTintColor: Colors.transparent,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: surface,
          contentPadding: const EdgeInsets.symmetric(horizontal: 15, vertical: 13),
          hintStyle: const TextStyle(color: inactive, fontSize: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(radius),
            borderSide: const BorderSide(color: border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(radius),
            borderSide: const BorderSide(color: border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(radius),
            borderSide: const BorderSide(color: green, width: 1.5),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: green,
            foregroundColor: Colors.white,
            minimumSize: const Size.fromHeight(47),
            padding: const EdgeInsets.symmetric(horizontal: 20),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius)),
            textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            splashFactory: NoSplash.splashFactory,
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: greenDark,
            side: const BorderSide(color: greenDark),
            minimumSize: const Size.fromHeight(47),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius)),
            textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
          ),
        ),
        cardTheme: CardThemeData(
          color: surface,
          elevation: 0,
          margin: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
            side: const BorderSide(color: border),
          ),
        ),
      );

  static BoxDecoration cardDecoration({Color color = surface, Border? border}) => BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(radius),
        border: border ?? Border.all(color: Solus.border),
        boxShadow: const [
          BoxShadow(color: Color(0x0F111827), blurRadius: 10, offset: Offset(0, 2)),
        ],
      );

  static InputDecoration field(String label, {String? hint, Widget? suffix, int maxLines = 1}) =>
      InputDecoration(
        labelText: label,
        hintText: hint,
        suffixIcon: suffix,
        alignLabelWithHint: maxLines > 1,
      );

  static SnackBar snack(String message, {bool error = false}) => SnackBar(
        content: Text(message, style: const TextStyle(color: Colors.white, fontSize: 13)),
        backgroundColor: error ? danger : ink,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      );
}

/// Formata datas ISO do backend (YYYY-MM-DD ou ISO completo) para pt-BR.
String formatDate(String? value) {
  if (value == null || value.isEmpty) return '—';
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return value;
  final local = parsed.toLocal();
  return '${local.day.toString().padLeft(2, '0')}/${local.month.toString().padLeft(2, '0')}/${local.year}';
}

String formatDateTime(String? value) {
  if (value == null || value.isEmpty) return '—';
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return value;
  final local = parsed.toLocal();
  return '${formatDate(value)} às ${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
}

String maskPhone(String value) {
  final digits = value.replaceAll(RegExp(r'\D'), '').substring(0, value.replaceAll(RegExp(r'\D'), '').length > 11 ? 11 : value.replaceAll(RegExp(r'\D'), '').length);
  if (digits.isEmpty) return '';
  if (digits.length <= 2) return '($digits';
  if (digits.length <= 6) return '(${digits.substring(0, 2)}) ${digits.substring(2)}';
  if (digits.length <= 10) {
    return '(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}';
  }
  return '(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}';
}

String initials(String? name) {
  if (name == null || name.trim().isEmpty) return '?';
  final parts = name.trim().split(RegExp(r'\s+'));
  if (parts.length == 1) return parts[0].substring(0, parts[0].length > 1 ? 2 : 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
