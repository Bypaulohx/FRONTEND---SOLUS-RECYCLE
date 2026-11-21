import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../../app.dart';
import '../../models.dart';
import '../../providers/session.dart';
import '../../services/api.dart';
import '../../services/storage.dart';
import '../../theme.dart';
import '../../utils/format.dart';
import '../../widgets/ui.dart';

/// Espelho de frontend/src/pages/AgendaEmpresa.tsx.
class AgendaEmpresaScreen extends StatefulWidget {
  final Map<String, String> params;

  const AgendaEmpresaScreen({super.key, required this.params});

  @override
  State<AgendaEmpresaScreen> createState() => _AgendaEmpresaScreenState();
}

class _AgendaEmpresaScreenState extends State<AgendaEmpresaScreen> {
  final List<Agendamento> _agendamentos = <Agendamento>[];
  String _periodo = 'hoje';
  int? _selecionado;
  String _erro = '';
  int _companyId = 0;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    final session = context.read<Session>();
    _companyId =
        session.me?.id ??
        int.tryParse(await Prefs.read(Prefs.companyIdKey) ?? '') ??
        0;
    if (_companyId > 0) {
      await Prefs.write(Prefs.companyIdKey, '$_companyId');
    }
    final resultado = await ApiClient.agendamentosDaEmpresa(_companyId);
    if (!mounted) return;
    if (resultado.error != null || resultado.data == null) {
      setState(() {
        _erro = resultado.error ?? 'Não foi possível carregar a agenda.';
      });
      return;
    }
    final dados = resultado.data!;
    final alvo = int.tryParse(widget.params['coleta'] ?? '');
    setState(() {
      _agendamentos
        ..clear()
        ..addAll(dados);
      if (alvo != null && dados.any((item) => item.id == alvo)) {
        _selecionado = alvo;
      } else if (dados.isNotEmpty) {
        _selecionado = dados.first.id;
      }
    });
  }

  List<Agendamento> get _filtrados {
    final agora = DateTime.now();
    final hoje = DateTime(agora.year, agora.month, agora.day);
    final dias = switch (_periodo) {
      'semana' => 7,
      'mes' => 31,
      _ => 1,
    };
    final limite = hoje.add(Duration(days: dias));
    return _agendamentos.where((item) {
      final tempo = DateTime.tryParse(item.scheduleTime);
      if (tempo == null) return false;
      return !tempo.isBefore(hoje) && tempo.isBefore(limite);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final filtrados = _filtrados;
    Agendamento? detalhe;
    for (final item in _agendamentos) {
      if (item.id == _selecionado) {
        detalhe = item;
        break;
      }
    }
    detalhe ??= filtrados.isEmpty ? null : filtrados.first;

    return AppScaffold(
      currentPath: '/agenda-empresa',
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 30),
        children: [
          PageTitle(
            eyebrow: 'Agenda da organização',
            title: fmtLongDate(DateTime.now()),
            subtitle:
                '${filtrados.length} '
                '${filtrados.length == 1 ? 'coleta' : 'coletas'} no período',
          ),
          if (_erro.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(
                _erro,
                style: const TextStyle(fontSize: 13, color: Solus.danger),
              ),
            ),
          const SizedBox(height: 18),
          Row(
            children: [
              for (final periodo in [
                ('hoje', 'Hoje'),
                ('semana', 'Semana'),
                ('mes', 'Mês'),
              ])
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: MiniButton(
                      periodo.$2,
                      variant: _periodo == periodo.$1
                          ? MiniButtonStyle.primary
                          : MiniButtonStyle.ghost,
                      onPressed: () => setState(() => _periodo = periodo.$1),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 2,
                height: filtrados.isEmpty ? 60.0 : 78.0 * filtrados.length,
                color: Solus.border,
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  children: [
                    for (final item in filtrados) ...[
                      _timelineItem(item, selected: detalhe?.id == item.id),
                      const SizedBox(height: 10),
                    ],
                    if (filtrados.isEmpty)
                      EmptyState(
                        'Nenhuma coleta neste período.',
                        compact: true,
                      ),
                  ],
                ),
              ),
            ],
          ),
          if (detalhe != null) ...[
            const SizedBox(height: 20),
            _detalhePanel(detalhe),
          ],
        ],
      ),
    );
  }

  Widget _timelineItem(Agendamento item, {required bool selected}) {
    return Stack(
      children: [
        InkWell(
          onTap: () => setState(() => _selecionado = item.id),
          child: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: selected ? Solus.greenSoft : Solus.surface,
              border: Border.all(color: selected ? Solus.green : Solus.border),
              borderRadius: BorderRadius.circular(Solus.radius),
            ),
            child: Row(
              children: [
                const SizedBox(width: 10),
                Text(
                  fmtTime(item.scheduleTime),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.userName ?? 'Morador',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${item.tipoResiduo ?? 'Recicláveis'} · '
                        '${oneDecimal(item.pesoEstimado)} kg',
                        style: const TextStyle(
                          fontSize: 10,
                          color: Solus.muted,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                AgendamentoStatusPill(item),
              ],
            ),
          ),
        ),
        Positioned(
          left: -19,
          top: 0,
          bottom: 0,
          child: Center(
            child: Container(
              width: 11,
              height: 11,
              decoration: BoxDecoration(
                color: Solus.green,
                border: Border.all(color: Colors.white, width: 2),
                shape: BoxShape.circle,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _detalhePanel(Agendamento detalhe) {
    final segundaEtapa =
        detalhe.status != 'PENDENTE' && detalhe.status != 'CANCELADO';
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FCF9),
        border: Border.all(color: Solus.border),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Coleta #${detalhe.id}',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
              AgendamentoStatusPill(detalhe),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            '${detalhe.userName ?? 'Morador'} · '
            '${detalhe.tipoResiduo ?? 'Recicláveis'} '
            '${oneDecimal(detalhe.pesoEstimado)} kg',
            style: const TextStyle(fontSize: 11, color: Solus.inactive),
          ),
          const Text(
            'Av. Paulista, 1000 — Bela Vista',
            style: TextStyle(fontSize: 11, color: Solus.inactive),
          ),
          Text(
            'Janela ${fmtTime(detalhe.scheduleTime)} · '
            '${fmtDateShort(detalhe.scheduleTime)}',
            style: const TextStyle(fontSize: 11, color: Solus.inactive),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 14),
            child: Divider(height: 1, color: Solus.border),
          ),
          const Text(
            'Status da confirmação',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          _step('Solicitação enviada', done: true),
          _step('Empresa aceitou a coleta', done: segundaEtapa),
          _step(
            detalhe.status == 'CONCLUIDO'
                ? 'QR confirmado'
                : 'Aguardando QR de confirmação',
            done: detalhe.status == 'CONCLUIDO',
            current: detalhe.status != 'CONCLUIDO',
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: MiniButton(
                  'Abrir chat',
                  variant: MiniButtonStyle.outline,
                  icon: LucideIcons.messageCircle,
                  onPressed: () =>
                      go(context, '/conversas', {'coleta': '${detalhe.id}'}),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: MiniButton(
                  'Confirmar com QR',
                  icon: LucideIcons.qrCode,
                  onPressed: () =>
                      go(context, '/escanear-qr', {'coleta': '${detalhe.id}'}),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _step(String texto, {bool done = false, bool current = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(
            width: 11,
            height: 11,
            decoration: BoxDecoration(
              color: done ? Solus.green : Colors.transparent,
              border: Border.all(color: Solus.green, width: 2),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),
          Text(
            texto,
            style: TextStyle(
              fontSize: 11,
              color: current ? Solus.greenDark : Solus.muted,
              fontWeight: current ? FontWeight.w700 : FontWeight.w400,
            ),
          ),
        ],
      ),
    );
  }
}
