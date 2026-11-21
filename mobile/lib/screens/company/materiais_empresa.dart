import 'dart:io';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../models.dart';
import '../../services/local_data.dart';
import '../../theme.dart';
import '../../utils/format.dart';
import '../../widgets/ui.dart';

/// Espelho de frontend/src/pages/MateriaisEmpresa.tsx.
class MateriaisEmpresaScreen extends StatefulWidget {
  const MateriaisEmpresaScreen({super.key});

  @override
  State<MateriaisEmpresaScreen> createState() => _MateriaisEmpresaScreenState();
}

class _MateriaisEmpresaScreenState extends State<MateriaisEmpresaScreen> {
  final List<Json> _lotes = <Json>[];
  String _mensagem = '';

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    final lotes = await LocalData.lots();
    if (!mounted) return;
    setState(() {
      _lotes
        ..clear()
        ..addAll(lotes);
    });
  }

  double get _totalKg => _lotes.fold<double>(
    0,
    (soma, lote) => soma + safeDouble(lote['weightKg']),
  );

  Future<void> _exportarRelatorio() async {
    final linhas = <String>[
      'Lote;Material;Peso (kg);Origem;Data;Destino',
      for (final lote in _lotes)
        [
          str(lote['id']) ?? '',
          str(lote['material']) ?? '',
          oneDecimal(safeDouble(lote['weightKg'])),
          str(lote['origin']) ?? '',
          str(lote['date']) ?? '',
          str(lote['destination']) ?? '',
        ].join(';'),
    ];
    final arquivo = File(
      '${Directory.systemTemp.path}${Platform.pathSeparator}'
      'solus-relatorio-materiais.csv',
    );
    try {
      await arquivo.writeAsString(linhas.join('\n'));
      if (!mounted) return;
      setState(() => _mensagem = 'Relatório de impactos gerado com sucesso.');
    } catch (_) {
      if (!mounted) return;
      setState(() => _mensagem = 'Não foi possível gerar o relatório.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalKg = _totalKg;
    return AppScaffold(
      currentPath: '/materiais-empresa',
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 30),
        children: [
          PageTitle(
            eyebrow: 'Reciclagem da organização',
            title: 'Materiais e impacto',
            subtitle: 'Lotes confirmados por QR',
            trailing: const Icon(
              LucideIcons.recycle,
              size: 26,
              color: Solus.green,
            ),
          ),
          if (_mensagem.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(
                _mensagem,
                style: const TextStyle(fontSize: 13, color: Solus.greenDark),
              ),
            ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: _kpi(_lotes.length.toString(), 'lotes', featured: true),
              ),
              const SizedBox(width: 8),
              Expanded(child: _kpi(oneDecimal(totalKg), 'kg recebidos')),
              const SizedBox(width: 8),
              Expanded(
                child: _kpi(oneDecimal(totalKg * 0.42), 'kg CO₂ evitados'),
              ),
            ],
          ),
          SectionTitle(
            'Lotes recebidos',
            action: const Icon(
              LucideIcons.trendingUp,
              size: 17,
              color: Solus.green,
            ),
          ),
          if (_lotes.isEmpty)
            EmptyState('Nenhum lote recebido ainda.', icon: LucideIcons.recycle)
          else
            Column(
              children: [
                for (final lote in _lotes)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _loteCard(lote),
                  ),
              ],
            ),
          const SizedBox(height: 22),
          SolusButton(
            'Gerar relatório CSV',
            icon: LucideIcons.download,
            onPressed: _exportarRelatorio,
          ),
          const SizedBox(height: 22),
          const Text(
            'Relatórios auditáveis e venda de materiais no marketplace financiam '
            'o serviço sem anúncios nem cobrança ao usuário.',
            style: TextStyle(fontSize: 11, color: Solus.muted, height: 1.5),
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
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: featured ? Solus.green : Solus.ink,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            rotulo,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 11, color: Solus.muted),
          ),
        ],
      ),
    );
  }

  Widget _loteCard(Json lote) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: Solus.cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  str(lote['material']) ?? '',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Text(
                '${oneDecimal(safeDouble(lote['weightKg']))} kg',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Solus.greenDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Lote ${str(lote['id']) ?? ''} · ${str(lote['date']) ?? ''}',
            style: const TextStyle(fontSize: 11, color: Solus.muted),
          ),
          Text(
            'Origem: ${str(lote['origin']) ?? ''}',
            style: const TextStyle(fontSize: 11, color: Solus.muted),
          ),
          Text(
            'Destino: ${str(lote['destination']) ?? ''}',
            style: const TextStyle(fontSize: 11, color: Solus.muted),
          ),
        ],
      ),
    );
  }
}
