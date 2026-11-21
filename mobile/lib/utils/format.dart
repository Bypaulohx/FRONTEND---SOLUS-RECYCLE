import 'dart:math' as math;

import 'package:intl/intl.dart';

/// Máscaras progressivas idênticas a frontend/src/utils/format.ts.
class Masks {
  static String digits(String value, [int max = 14]) {
    final only = value.replaceAll(RegExp(r'\D'), '');
    return only.length > max ? only.substring(0, max) : only;
  }

  static String document(String value) {
    final d = digits(value, 14);
    if (d.length > 11) {
      final p = d.padRight(14, '0');
      return '${p.substring(0, 2)}.${p.substring(2, 5)}.${p.substring(5, 8)}/${p.substring(8, 12)}-${p.substring(12, 14)}';
    }
    final p = d.padRight(11, '0');
    return '${p.substring(0, 3)}.${p.substring(3, 6)}.${p.substring(6, 9)}-${p.substring(9, 11)}';
  }

  static String cep(String value) {
    final d = digits(value, 8);
    if (d.length > 5) return '${d.substring(0, 5)}-${d.substring(5)}';
    return d;
  }

  static String phone(String value) {
    final d = digits(value, 11);
    if (d.isEmpty) return '';
    if (d.length <= 2) return '($d';
    if (d.length <= 6) return '(${d.substring(0, 2)}) ${d.substring(2)}';
    if (d.length <= 10) {
      return '(${d.substring(0, 2)}) ${d.substring(2, 6)}-${d.substring(6)}';
    }
    return '(${d.substring(0, 2)}) ${d.substring(2, 7)}-${d.substring(7)}';
  }

  static String currency(num points) {
    final parts = (points / 20).toStringAsFixed(2).split('.');
    final integer = parts[0].replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]}.',
    );
    return 'R\$ $integer,${parts[1]}';
  }
}

/// Helpers de formatação pt-BR usados pelas telas.
String fmtDate(String? value) {
  if (value == null || value.isEmpty) return '—';
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return value;
  final local = parsed.toLocal();
  return '${local.day.toString().padLeft(2, '0')}/${local.month.toString().padLeft(2, '0')}/${local.year}';
}

String fmtDateShort(String? value) {
  if (value == null || value.isEmpty) return '—';
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return value;
  final local = parsed.toLocal();
  return '${local.day.toString().padLeft(2, '0')}/${local.month.toString().padLeft(2, '0')}';
}

String fmtTime(String? value) {
  if (value == null || value.isEmpty) return '—';
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return value;
  final local = parsed.toLocal();
  return '${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
}

/// Formato usado em Home/Confirmação: dd/MM - HH:mm
String fmtDateTimeShort(String? value) => '${fmtDateShort(value)} - ${fmtTime(value)}';

/// Formato usado no Dashboard da empresa: dd/MM HH:mm
String fmtDashboardDate(String? value) => '${fmtDateShort(value)} ${fmtTime(value)}';

String fmtLongDate(DateTime value) =>
    DateFormat('EEEE, d de MMMM', 'pt_BR').format(value);

String hhmmNow() => DateFormat('HH:mm', 'pt_BR').format(DateTime.now());

String ddmmNow() => DateFormat('dd/MM', 'pt_BR').format(DateTime.now());

String isoNow() => DateFormat('yyyy-MM-dd', 'pt_BR').format(DateTime.now());

String oneDecimal(double? value) => (value ?? 0).toStringAsFixed(1);

double safeDouble(dynamic value) =>
    value is num ? value.toDouble() : double.tryParse(value?.toString() ?? '') ?? 0;

int pointsForWeight(double? weightKg) {
  if (weightKg == null || weightKg <= 0) return 30;
  return math.max(10, (weightKg * 6).round());
}
