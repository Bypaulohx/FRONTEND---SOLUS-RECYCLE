import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../services/external.dart';
import '../../theme.dart';
import '../../widgets/ui.dart';

class AjudaScreen extends StatefulWidget {
  const AjudaScreen({super.key});

  @override
  State<AjudaScreen> createState() => _AjudaScreenState();
}

class _AjudaScreenState extends State<AjudaScreen> {
  static const List<({String q, String a})> _faqs = [
    (
      q: 'Como agendar uma coleta?',
      a: 'Acesse o Mapa, escolha um ponto ou catador e preencha a data e os materiais.',
    ),
    (
      q: 'Quais materiais são aceitos?',
      a: 'Papel, plástico, vidro, metal e eletrônicos, conforme o ponto de coleta.',
    ),
    (
      q: 'Posso cancelar um agendamento?',
      a: 'Sim, em Coletas agendadas você pode cancelar ou reagendar.',
    ),
  ];

  int? _openIndex;

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      currentPath: '/ajuda',
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SolusBackButton(),
            const SizedBox(height: 12),
            const Text(
              'Ajuda',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            ...List.generate(_faqs.length, (index) {
              final faq = _faqs[index];
              final open = _openIndex == index;
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF9F9F9),
                    borderRadius: BorderRadius.circular(Solus.radius),
                    border: Border.all(color: Solus.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      InkWell(
                        onTap: () =>
                            setState(() => _openIndex = open ? null : index),
                        child: Padding(
                          padding: const EdgeInsets.all(15),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  faq.q,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              Icon(
                                open
                                    ? LucideIcons.chevronUp
                                    : LucideIcons.chevronDown,
                                size: 18,
                                color: Solus.greenDark,
                              ),
                            ],
                          ),
                        ),
                      ),
                      if (open)
                        Container(
                          padding: const EdgeInsets.fromLTRB(15, 0, 15, 15),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Solus.greenSoft,
                              borderRadius: BorderRadius.circular(Solus.radius),
                            ),
                            child: Text(
                              faq.a,
                              style: const TextStyle(fontSize: 13, height: 1.5),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              );
            }),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Solus.surface,
                borderRadius: BorderRadius.circular(Solus.radius),
                border: Border.all(color: Solus.border),
              ),
              child: RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  style: const TextStyle(fontSize: 14, color: Solus.muted),
                  children: [
                    const TextSpan(text: 'Dúvidas? Entre em contato: '),
                    WidgetSpan(
                      child: InkWell(
                        onTap: () =>
                            External.open('mailto:contato@solusrecycle.app'),
                        child: const Text(
                          'contato@solusrecycle.app',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Solus.greenDark,
                          ),
                        ),
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
