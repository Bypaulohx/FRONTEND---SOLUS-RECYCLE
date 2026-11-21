import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../../app.dart';
import '../../models.dart';
import '../../providers/session.dart';
import '../../services/api.dart';
import '../../services/local_data.dart';
import '../../services/storage.dart';
import '../../theme.dart';
import '../../utils/format.dart';
import '../../widgets/ui.dart';

/// Espelho de frontend/src/pages/DashboardEmpresa.tsx.
class DashboardEmpresaScreen extends StatefulWidget {
  const DashboardEmpresaScreen({super.key});

  @override
  State<DashboardEmpresaScreen> createState() => _DashboardEmpresaScreenState();
}

class _DashboardEmpresaScreenState extends State<DashboardEmpresaScreen> {
  final List<Agendamento> _agendamentos = <Agendamento>[];
  String _erro = '';
  int? _processando;
  bool _carregando = true;
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
    setState(() {
      _carregando = false;
      if (resultado.error != null || resultado.data == null) {
        _erro = resultado.error ?? 'Não foi possível carregar as coletas.';
      } else {
        _agendamentos
          ..clear()
          ..addAll(resultado.data!);
      }
    });
  }

  List<Agendamento> get _pendentes =>
      _agendamentos.where((item) => item.pendente).toList();

  List<Agendamento> get _agendadas =>
      _agendamentos.where((item) => item.confirmado).toList();

  List<Agendamento> get _concluidas =>
      _agendamentos.where((item) => item.concluido).toList();

  Future<void> _pedirDecisao(Agendamento agendamento, String acao) async {
    final mensagem = switch (acao) {
      'receber' => 'Confirmar o recebimento da coleta #${agendamento.id}?',
      'recusar' =>
        'Recusar a coleta #${agendamento.id}? O morador será avisado.',
      _ =>
        'Você vai avisar no chat que está indo buscar e abrir a rota até ${agendamento.userEndereco ?? 'o endereço do cliente'}.',
    };
    final confirmado = await confirmDialog(
      context,
      title: 'Confirmar decisão',
      message: mensagem,
    );
    if (!confirmado || !mounted) return;
    await _executarDecisao(agendamento, acao);
  }

  Future<void> _executarDecisao(Agendamento agendamento, String acao) async {
    if (acao == 'buscar') {
      await LocalData.sendMessage(
        '${agendamento.id}',
        'Estou indo buscar os materiais. Até já!',
        'COMPANY',
      );
      if (!mounted) return;
      await openNavigation(
        context: context,
        endereco: agendamento.userEndereco ?? 'Endereço do cliente',
        label: 'Coleta #${agendamento.id}',
      );
    }

    setState(() {
      _processando = agendamento.id;
      _erro = '';
    });

    final resultado = acao == 'recusar'
        ? await ApiClient.recusarAgendamento(agendamento.id)
        : await ApiClient.confirmarAgendamento(agendamento.id);

    if (!mounted) return;
    setState(() {
      _processando = null;
      if (resultado.error != null || resultado.data == null) {
        _erro = resultado.error ?? 'Não foi possível atualizar a coleta.';
      } else {
        final atualizado = resultado.data!;
        final indice = _agendamentos.indexWhere(
          (item) => item.id == atualizado.id,
        );
        if (indice >= 0) _agendamentos[indice] = atualizado;
      }
    });

    if (resultado.ok && (acao == 'buscar' || acao == 'receber')) {
      if (!mounted) return;
      if (acao == 'buscar') {
        go(context, '/conversas', {'coleta': '${agendamento.id}'});
      } else {
        go(context, '/agenda-empresa');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();
    final nome = session.me?.nomeFantasia ?? session.me?.nome ?? 'Organização';
    final proximas = <Agendamento>[
      ..._agendadas,
      ..._concluidas,
    ].take(4).toList();

    return AppScaffold(
      currentPath: '/dashboard-empresa',
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 30),
        children: [
          PageTitle(
            eyebrow: 'Painel da organização',
            title: nome,
            subtitle: 'Solus Reciclagem · Unidade Paulista',
            trailing: const Icon(
              LucideIcons.recycle,
              size: 26,
              color: Solus.green,
            ),
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
              Expanded(
                child: _kpi(
                  '${_pendentes.length}',
                  'aguardando',
                  featured: true,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(child: _kpi('${_agendadas.length}', 'agendadas')),
              const SizedBox(width: 8),
              Expanded(child: _kpi('${_concluidas.length}', 'concluídas')),
            ],
          ),
          SectionTitle(
            'Decisões pendentes',
            action: LinkAction(
              'Ver todas',
              () => go(context, '/agenda-empresa'),
              icon: LucideIcons.arrowRight,
            ),
          ),
          if (_carregando)
            const LoadingView(label: 'Carregando decisões...')
          else if (_pendentes.isEmpty)
            EmptyState(
              'Nenhuma solicitação aguardando decisão.',
              icon: LucideIcons.check,
            )
          else
            Column(
              children: [
                for (final item in _pendentes)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _decisaoCard(context, item),
                  ),
              ],
            ),
          SectionTitle(
            'Próximas coletas',
            action: LinkAction(
              'Abrir agenda',
              () => go(context, '/agenda-empresa'),
            ),
          ),
          if (proximas.isEmpty)
            EmptyState('Ainda não há coletas confirmadas hoje.', compact: true)
          else
            Column(
              children: [
                for (final item in proximas)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _proximaCard(item),
                  ),
              ],
            ),
          const SizedBox(height: 22),
          Row(
            children: [
              Expanded(
                child: _shortcut(
                  context,
                  LucideIcons.mapPin,
                  'Editar ponto',
                  '/mapa-empresa',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _shortcut(
                  context,
                  LucideIcons.messageCircle,
                  'Conversas',
                  '/conversas',
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _shortcut(
                  context,
                  LucideIcons.recycle,
                  'Materiais',
                  '/materiais-empresa',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _kpi(String valor, String rotulo, {bool featured = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 6),
      decoration: BoxDecoration(
        color: featured ? Solus.greenSoft : Solus.surface,
        borderRadius: BorderRadius.circular(Solus.radius),
        border: featured ? null : Border.all(color: Solus.border),
      ),
      child: Column(
        children: [
          Text(
            valor,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: featured ? Solus.green : Solus.ink,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            rotulo,
            style: const TextStyle(fontSize: 11, color: Solus.muted),
          ),
        ],
      ),
    );
  }

  Widget _decisaoCard(BuildContext context, Agendamento item) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: Solus.cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Avatar(item.userName ?? 'U', size: 36),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.userName ?? 'Morador',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${item.tipoResiduo ?? 'Materiais recicláveis'} · '
                      '${oneDecimal(item.pesoEstimado)} kg',
                      style: const TextStyle(fontSize: 11, color: Solus.muted),
                    ),
                    Text(
                      fmtDashboardDate(item.scheduleTime),
                      style: const TextStyle(
                        fontSize: 11,
                        color: Solus.inactive,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              MiniButton(
                'Receber',
                onPressed: _processando == item.id
                    ? null
                    : () => _pedirDecisao(item, 'receber'),
              ),
              const SizedBox(width: 8),
              MiniButton(
                'Buscar',
                variant: MiniButtonStyle.outline,
                onPressed: _processando == item.id
                    ? null
                    : () => _pedirDecisao(item, 'buscar'),
              ),
              const SizedBox(width: 8),
              MiniButton(
                'Recusar',
                variant: MiniButtonStyle.ghost,
                onPressed: _processando == item.id
                    ? null
                    : () => _pedirDecisao(item, 'recusar'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _proximaCard(Agendamento item) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: Solus.cardDecoration(),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: const BoxDecoration(
              color: Solus.greenSoft,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              LucideIcons.calendarDays,
              size: 18,
              color: Solus.greenDark,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${fmtDashboardDate(item.scheduleTime)} · '
                  '${item.userName ?? 'Morador'}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${item.tipoResiduo ?? 'Recicláveis'} · '
                  '${oneDecimal(item.pesoEstimado)} kg',
                  style: const TextStyle(fontSize: 11, color: Solus.muted),
                ),
              ],
            ),
          ),
          AgendamentoStatusPill(item),
        ],
      ),
    );
  }

  Widget _shortcut(
    BuildContext context,
    IconData icon,
    String label,
    String rota,
  ) {
    return InkWell(
      onTap: () => go(context, rota),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
        decoration: Solus.cardDecoration(),
        child: Column(
          children: [
            Icon(icon, size: 18, color: Solus.greenDark),
            const SizedBox(height: 6),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Solus.greenDark,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
