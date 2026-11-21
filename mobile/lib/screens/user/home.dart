import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../../app.dart';
import '../../models.dart';
import '../../theme.dart';
import '../../providers/session.dart';
import '../../services/api.dart';
import '../../utils/format.dart';
import '../../widgets/ui.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Agendamento? _proxima;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    final resultado = await ApiClient.meusAgendamentos();
    if (!mounted || !resultado.ok || resultado.data == null) return;
    final ativas =
        resultado.data!
            .where((item) => item.pendente || item.confirmado)
            .toList()
          ..sort((a, b) => _epoch(a).compareTo(_epoch(b)));
    setState(() => _proxima = ativas.isEmpty ? null : ativas.first);
  }

  int _epoch(Agendamento agendamento) =>
      DateTime.tryParse(agendamento.scheduleTime)?.millisecondsSinceEpoch ?? 0;

  void _abrirQr(Agendamento proxima) =>
      go(context, '/qr-code', {'coleta': proxima.id.toString()});

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();
    final nome = session.me?.nome ?? 'Usuário';
    final proxima = _proxima;

    final cards = <({IconData icon, String label, String route})>[
      (
        icon: LucideIcons.mapPin,
        label: 'Veja pontos de coleta',
        route: '/mapa',
      ),
      (
        icon: LucideIcons.messageCircle,
        label: 'Conversas',
        route: '/conversas',
      ),
      (icon: LucideIcons.sparkles, label: 'Recompensas', route: '/recompensas'),
      (
        icon: LucideIcons.recycle,
        label: 'O que posso reciclar',
        route: '/reciclagem',
      ),
    ];

    return AppScaffold(
      currentPath: '/home',
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'Olá, $nome',
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: Solus.cardDecoration(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (proxima != null)
                  RichText(
                    text: TextSpan(
                      style: const TextStyle(
                        fontSize: 14,
                        height: 1.5,
                        color: Solus.ink,
                      ),
                      children: [
                        const TextSpan(text: 'Sua reciclagem será feita em '),
                        TextSpan(
                          text: fmtDateTimeShort(proxima.scheduleTime),
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Solus.greenDark,
                          ),
                        ),
                        TextSpan(
                          text:
                              ' com ${proxima.companyNomeFantasia ?? 'Solus Reciclagem'}.',
                        ),
                      ],
                    ),
                  )
                else
                  const Text(
                    'Encontre pontos de coleta perto de você e agende sua primeira coleta.',
                    style: TextStyle(fontSize: 14, height: 1.5),
                  ),
                const SizedBox(height: 12),
                SolusButton(
                  proxima != null ? 'Ver QR' : 'Ver local',
                  icon: proxima != null ? LucideIcons.qrCode : null,
                  minWidth: 150,
                  onPressed: () => proxima != null
                      ? _abrirQr(proxima)
                      : go(context, '/mapa'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 14,
            crossAxisSpacing: 14,
            childAspectRatio: 1.7,
            children: [
              for (final card in cards)
                Container(
                  decoration: Solus.cardDecoration(),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => go(context, card.route),
                      borderRadius: BorderRadius.circular(Solus.radius),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 12,
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(card.icon, size: 26, color: Solus.greenDark),
                            const SizedBox(height: 10),
                            Text(
                              card.label,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
          SectionTitle(
            proxima != null
                ? 'Acompanhe sua coleta:'
                : 'Agende sua coleta em domicílio:',
            margin: const EdgeInsets.only(top: 10, bottom: 14),
          ),
          Row(
            children: [
              Expanded(
                child: SolusButton(
                  proxima != null ? 'Mostrar QR' : 'Ir para o mapa',
                  minWidth: double.infinity,
                  onPressed: () => proxima != null
                      ? _abrirQr(proxima)
                      : go(context, '/mapa'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: SolusButton(
                  'Minhas coletas',
                  outlined: true,
                  icon: LucideIcons.calendarDays,
                  minWidth: double.infinity,
                  onPressed: () => go(context, '/confirmacao-agendamento'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
