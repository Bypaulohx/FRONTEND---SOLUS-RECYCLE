import 'dart:math' as math;

import '../models.dart';

double distanceKm(double lat1, double lon1, double lat2, double lon2) {
  const radius = 6371.0;
  final dLat = _rad(lat2 - lat1);
  final dLon = _rad(lon2 - lon1);
  final a = math.pow(math.sin(dLat / 2), 2) +
      math.cos(_rad(lat1)) *
          math.cos(_rad(lat2)) *
          math.pow(math.sin(dLon / 2), 2);
  return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
}

double _rad(double degrees) => degrees * math.pi / 180;

List<String> materiaisDoPonto(PontoColeta ponto) {
  if (ponto.materiais.isNotEmpty) return ponto.materiais;
  return (ponto.tipoResiduo ?? '')
      .split(RegExp(r'[,;]'))
      .map((e) => e.trim())
      .where((e) => e.isNotEmpty)
      .toList();
}

bool abertoAgora(List<Funcionamento> horarios, [DateTime? agora]) {
  if (horarios.isEmpty) return true;
  final now = agora ?? DateTime.now();
  final weekday = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][now.weekday % 7];
  final hhmm = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
  for (final h in horarios) {
    final dia = (h.diaSemana ?? '').toLowerCase();
    final diaOk = dia.contains('todos') ||
        dia.contains('diário') ||
        dia.contains('diario') ||
        dia.contains('seg. a sex') ||
        dia.contains('seg a sex') ||
        dia.contains(weekday) ||
        (dia.contains('fim de semana') && (weekday == 'sab' || weekday == 'dom'));
    final abertura = h.horarioAbertura;
    final fechamento = h.horarioFechamento;
    final horaOk = abertura == null ||
        fechamento == null ||
        (hhmm.compareTo(abertura) >= 0 && hhmm.compareTo(fechamento) <= 0);
    if (diaOk && horaOk) return true;
  }
  return false;
}

String rotuloFuncionamento(List<Funcionamento> horarios) {
  if (horarios.isEmpty) return 'Horário não informado';
  return horarios.take(2).map((h) {
    final dia = h.diaSemana ?? '';
    final abertura = h.horarioAbertura ?? '';
    final fechamento = h.horarioFechamento ?? '';
    return '$dia $abertura às $fechamento'.trim();
  }).join(' · ');
}
