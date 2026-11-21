import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../app.dart';
import '../../services/local_data.dart';
import '../../theme.dart';
import '../../widgets/ui.dart';

class RecompensasScreen extends StatefulWidget {
  const RecompensasScreen({super.key});

  @override
  State<RecompensasScreen> createState() => _RecompensasScreenState();
}

class _RecompensasScreenState extends State<RecompensasScreen> {
  static const int nivelPrata = LocalData.nivelPrata;

  int _pontos = 0;
  List<Map<String, dynamic>> _historico = const [];
  bool _extratoAberto = false;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    final pontos = await LocalData.credits();
    final historico = await LocalData.creditHistory();
    if (!mounted) return;
    setState(() {
      _pontos = pontos;
      _historico = historico;
    });
  }

  @override
  Widget build(BuildContext context) {
    final faltam = (nivelPrata - _pontos) > 0 ? nivelPrata - _pontos : 0;
    final progresso = (_pontos / nivelPrata * 100).round().clamp(0, 100);

    return AppScaffold(
      currentPath: '/recompensas',
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 30),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Reciclagem',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Solus.greenDark,
                          letterSpacing: .8,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Meus créditos',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(height: 5),
                      Text(
                        'Seu impacto vale',
                        style: TextStyle(fontSize: 11, color: Solus.muted),
                      ),
                    ],
                  ),
                ),
                const Icon(LucideIcons.leaf, size: 26, color: Solus.green),
              ],
            ),
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Solus.green,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$_pontos pontos',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    '≈ ${LocalData.creditInReais(_pontos)} em crédito de reciclagem',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: Container(
                      height: 6,
                      color: Colors.white.withValues(alpha: .35),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: FractionallySizedBox(
                          widthFactor: progresso / 100,
                          child: Container(color: Colors.white),
                        ),
                      ),
                    ),
                  ),
                  Text(
                    faltam == 0
                        ? 'Nível Prata alcançado!'
                        : '$faltam pts para o nível Prata',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
            const SectionTitle('Como usar'),
            const _RewardOption(
              icon: LucideIcons.coins,
              title: 'Desconto em taxas do app',
              text: 'Use seus pontos como crédito em coletas futuras: 20 pts = R\$ 1,00.',
            ),
            const _RewardOption(
              icon: LucideIcons.gift,
              title: 'Benefícios na coletora',
              text: 'Troque por descontos ou vantagens nas organizações parceiras cadastradas.',
            ),
            const _RewardOption(
              icon: LucideIcons.heart,
              title: 'Doar para uma ONG',
              text: 'Converta seus pontos em apoio a projetos de reciclagem e educação ambiental.',
            ),
            SectionTitle(
              'Últimas coletas',
              action: LinkAction(
                _extratoAberto ? 'Fechar extrato' : 'Ver extrato de impactos',
                () => setState(() => _extratoAberto = !_extratoAberto),
              ),
            ),
            if (_extratoAberto)
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Solus.greenSoft,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${_historico.length} coletas confirmadas por QR. Pontos liberados somente após a leitura pelo recebedor.',
                  style: const TextStyle(
                    fontSize: 11,
                    color: Solus.greenDark,
                    height: 1.5,
                  ),
                ),
              ),
            const SizedBox(height: 10),
            ..._historico.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Solus.surface,
                    borderRadius: BorderRadius.circular(Solus.radius),
                    border: Border.all(color: Solus.border),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 27,
                        height: 27,
                        decoration: const BoxDecoration(
                          color: Solus.green,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          LucideIcons.recycle,
                          size: 15,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '+${item['points']} pts · ${item['material']}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${item['date']} · confirmado por QR',
                              style: const TextStyle(
                                fontSize: 10,
                                color: Solus.muted,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '${item['points']}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Solus.greenDark,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Text(
                'Créditos liberados após a confirmação por QR no momento da coleta.',
                style: TextStyle(fontSize: 11, color: Solus.muted, height: 1.5),
              ),
            ),
            SolusButton(
              'O que posso reciclar',
              outlined: true,
              onPressed: () => go(context, '/reciclagem'),
            ),
          ],
        ),
      ),
    );
  }
}

class _RewardOption extends StatelessWidget {
  final IconData icon;
  final String title;
  final String text;

  const _RewardOption({
    required this.icon,
    required this.title,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Solus.surface,
          borderRadius: BorderRadius.circular(Solus.radius),
          border: Border.all(color: Solus.border),
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: Solus.greenDark),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    text,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Solus.muted,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
