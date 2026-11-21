import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../app.dart';
import '../../models.dart';
import '../../theme.dart';
import '../../services/api.dart';
import '../../utils/format.dart';
import '../../widgets/ui.dart';
import 'agendamento.dart';

class ConfirmacaoAgendamentoScreen extends StatefulWidget {
  final Map<String, String> params;

  const ConfirmacaoAgendamentoScreen({super.key, required this.params});

  @override
  State<ConfirmacaoAgendamentoScreen> createState() =>
      _ConfirmacaoAgendamentoScreenState();
}

class _ConfirmacaoAgendamentoScreenState
    extends State<ConfirmacaoAgendamentoScreen> {
  bool _carregando = true;
  List<Agendamento> _agendamentos = const [];

  String? get _pontoId {
    final valor = widget.params['ponto'];
    return valor != null && valor.isNotEmpty ? valor : null;
  }

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    final resultado = await ApiClient.meusAgendamentos();
    if (!mounted) return;
    final itens = <Agendamento>[];
    final criado = ultimoAgendamentoCriado;
    final idParam = widget.params['id'];
    if (criado != null && idParam != null && criado.id.toString() == idParam) {
      itens.add(criado);
    }
    for (final item in resultado.data ?? const <Agendamento>[]) {
      if (!itens.any((atual) => atual.id == item.id)) itens.add(item);
    }
    setState(() {
      _agendamentos = itens;
      _carregando = false;
    });
  }

  int _epoch(Agendamento agendamento) =>
      DateTime.tryParse(agendamento.scheduleTime)?.millisecondsSinceEpoch ?? 0;

  @override
  Widget build(BuildContext context) {
    final ativos =
        _agendamentos.where((item) => item.pendente || item.confirmado).toList()
          ..sort((a, b) => _epoch(a).compareTo(_epoch(b)));
    final historico = _agendamentos
        .where((item) => item.concluido || item.cancelado)
        .toList();
    final titulo = ativos.isEmpty
        ? 'Sua agenda de reciclagem'
        : 'Você possui ${ativos.length} ${ativos.length == 1 ? 'coleta agendada' : 'coletas agendadas'}';

    return AppScaffold(
      currentPath: '/confirmacao-agendamento',
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 30),
        children: [
          Text(
            titulo,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
          ),
          if (_pontoId != null)
            const Padding(
              padding: EdgeInsets.only(top: 12),
              child: Text(
                'Selecione uma coleta abaixo ou agende uma nova neste ponto.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                  color: Solus.muted,
                ),
              ),
            ),
          const SizedBox(height: 20),
          if (_carregando && ativos.isEmpty)
            const LoadingView(label: 'Carregando...'),
          for (final item in ativos) ...[
            _ActiveCard(item: item),
            const SizedBox(height: 14),
          ],
          if (!_carregando && ativos.isEmpty)
            EmptyState(
              'Você ainda não possui coletas agendadas.',
              icon: LucideIcons.calendarDays,
            ),
          if (historico.isNotEmpty) ...[
            SectionTitle('Histórico'),
            ...historico.map(
              (item) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: Solus.cardDecoration(),
                child: Row(
                  children: [
                    const Icon(
                      LucideIcons.mapPin,
                      size: 15,
                      color: Solus.greenDark,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '${item.companyNomeFantasia ?? 'Solus Reciclagem'} · ${fmtDateTimeShort(item.scheduleTime)}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Solus.muted,
                        ),
                      ),
                    ),
                    AgendamentoStatusPill(item),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 24),
          SolusButton(
            'Agendar uma coleta',
            icon: LucideIcons.calendarDays,
            minWidth: double.infinity,
            onPressed: () => go(
              context,
              '/agendamento',
              _pontoId != null ? {'ponto': _pontoId!} : null,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActiveCard extends StatelessWidget {
  final Agendamento item;

  const _ActiveCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: Solus.cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item.companyNomeFantasia ?? 'Solus Reciclagem',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    height: 1.35,
                  ),
                ),
              ),
              AgendamentoStatusPill(item),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(
                LucideIcons.calendarDays,
                size: 16,
                color: Solus.greenDark,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  '${fmtDateTimeShort(item.scheduleTime)} · ${item.tipoResiduo ?? 'Recicláveis'}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Solus.greenDark,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Text(
            '*Deixe seus resíduos recicláveis prontos para retirada e fique atento ao seu telefone.',
            style: TextStyle(
              fontSize: 12,
              fontStyle: FontStyle.italic,
              color: Solus.muted,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: SolusButton(
                  'Mostrar QR',
                  icon: LucideIcons.qrCode,
                  minWidth: double.infinity,
                  onPressed: () =>
                      go(context, '/qr-code', {'coleta': item.id.toString()}),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: SolusButton(
                  'Conversar',
                  outlined: true,
                  icon: LucideIcons.messageCircle,
                  minWidth: double.infinity,
                  onPressed: () =>
                      go(context, '/conversas', {'coleta': item.id.toString()}),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 47,
            child: ElevatedButton(
              onPressed: () => go(context, '/confirmacao-cancelamento', {
                'id': item.id.toString(),
              }),
              style: ElevatedButton.styleFrom(
                backgroundColor: Solus.danger,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(Solus.radius),
                ),
                textStyle: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              child: const Text('Cancelar coleta'),
            ),
          ),
        ],
      ),
    );
  }
}
