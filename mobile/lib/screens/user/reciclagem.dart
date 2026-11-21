import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../theme.dart';
import '../../widgets/ui.dart';

class ReciclagemScreen extends StatefulWidget {
  const ReciclagemScreen({super.key});

  @override
  State<ReciclagemScreen> createState() => _ReciclagemScreenState();
}

class _ReciclagemScreenState extends State<ReciclagemScreen> {
  int? _aberto;

  static const List<({IconData icon, String titulo, String texto})> _pontos = [
    (
      icon: LucideIcons.coins,
      titulo: 'Desconto em taxa do app',
      texto: 'Cada 20 pontos valem R\$ 1,00 em coletas futuras.',
    ),
    (
      icon: LucideIcons.gift,
      titulo: 'Benefícios na coletora',
      texto: 'Vantagens e descontos nas organizações parceiras cadastradas.',
    ),
    (
      icon: LucideIcons.heart,
      titulo: 'Doar para uma ONG',
      texto: 'Converta seus pontos em apoio a projetos de reciclagem e educação ambiental.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      currentPath: '/reciclagem',
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SolusBackButton(),
            const SizedBox(height: 12),
            const Text(
              'O que posso reciclar',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const Padding(
              padding: EdgeInsets.only(top: 8, bottom: 18),
              child: Text(
                'Separe os materiais com segurança e ganhe créditos a cada coleta confirmada.',
                style: TextStyle(fontSize: 14, color: Solus.muted, height: 1.5),
              ),
            ),
            ..._faqs.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _FaqCard(
                  icon: item.icon,
                  title: item.titulo,
                  answer: item.texto,
                  open: _aberto == item.id,
                  onTap: () => setState(
                    () => _aberto = _aberto == item.id ? null : item.id,
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 22, bottom: 10),
              child: const Text(
                'Descarte seguro',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Solus.surface,
                borderRadius: BorderRadius.circular(Solus.radius),
                border: Border.all(color: Solus.border),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Icon(
                    LucideIcons.shieldCheck,
                    size: 20,
                    color: Solus.greenDark,
                  ),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Use luvas ao manusear materiais cortantes, nunca misture resíduos químicos ou hospitalares com recicláveis e mantenha os volumes secos até a coleta.',
                      style: TextStyle(
                        fontSize: 12,
                        color: Solus.muted,
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SectionTitle('Seus pontos também valem'),
            ..._pontos.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(item.icon, size: 18, color: Solus.greenDark),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.titulo,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            item.texto,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Solus.muted,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

const List<({int id, IconData icon, String titulo, String texto})> _faqs = [
  (
    id: 1,
    icon: LucideIcons.newspaper,
    titulo: 'Papel e papelão',
    texto: 'Caixas, jornal, revistas e folhas. Mantenha seco e limpo; dobre as caixas para ocupar menos espaço.',
  ),
  (
    id: 2,
    icon: LucideIcons.milk,
    titulo: 'Plástico',
    texto: 'Garrafas PET, embalagens, potes e tampinhas. Enxágue rapidamente e separe por tipo de resina quando possível.',
  ),
  (
    id: 3,
    icon: LucideIcons.glassWater,
    titulo: 'Vidro',
    texto: 'Garrafas, frascos e recipientes. Retire tampas e não misture com cerâmica ou espelhos.',
  ),
  (
    id: 4,
    icon: LucideIcons.can,
    titulo: 'Metal',
    texto: 'Latas de alumínio, arames e utensílios. Enxágue e compacte as latas sem deixar resíduos de alimentos.',
  ),
  (
    id: 5,
    icon: LucideIcons.batteryWarning,
    titulo: 'Eletrônicos e pilhas',
    texto: 'Leve a pontos específicos de descarte. Nunca jogue pilhas, baterias ou aparelhos no lixo comum.',
  ),
];

class _FaqCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String answer;
  final bool open;
  final VoidCallback onTap;

  const _FaqCard({
    required this.icon,
    required this.title,
    required this.answer,
    required this.open,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF9F9F9),
        borderRadius: BorderRadius.circular(Solus.radius),
        border: Border.all(color: Solus.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(15),
              child: Row(
                children: [
                  Icon(icon, size: 19, color: Solus.greenDark),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  Icon(
                    open ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                    size: 18,
                    color: Solus.greenDark,
                  ),
                ],
              ),
            ),
          ),
          if (open)
            Container(
              margin: const EdgeInsets.fromLTRB(15, 0, 15, 15),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Solus.greenSoft,
                borderRadius: BorderRadius.circular(Solus.radius),
              ),
              child: Text(
                answer,
                style: const TextStyle(fontSize: 13, height: 1.5),
              ),
            ),
        ],
      ),
    );
  }
}
