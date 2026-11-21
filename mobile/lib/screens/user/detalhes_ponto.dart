import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../app.dart';
import '../../models.dart';
import '../../theme.dart';
import '../../services/api.dart';
import '../../utils/geo.dart';
import '../../widgets/ui.dart';

class DetalhesPontoScreen extends StatefulWidget {
  final Map<String, String> params;

  const DetalhesPontoScreen({super.key, required this.params});

  @override
  State<DetalhesPontoScreen> createState() => _DetalhesPontoScreenState();
}

class _DetalhesPontoScreenState extends State<DetalhesPontoScreen> {
  bool _carregando = true;
  PontoColeta? _ponto;

  String get _pontoId => widget.params['ponto'] ?? '';

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    final resultado = await ApiClient.pontos();
    if (!mounted) return;
    final id = int.tryParse(_pontoId);
    setState(() {
      _ponto = (resultado.data ?? const <PontoColeta>[])
          .cast<PontoColeta?>()
          .firstWhere((item) => item?.id == id, orElse: () => null);
      _carregando = false;
    });
  }

  String _pesoLabel(double? valor) {
    if (valor == null) return '—';
    return valor == valor.roundToDouble()
        ? valor.round().toString()
        : valor.toStringAsFixed(1).replaceAll('.', ',');
  }

  Widget _infoRow(IconData icon, String titulo, String valor) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 9),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: Solus.greenDark),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                titulo,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                valor,
                style: const TextStyle(fontSize: 13, color: Solus.muted),
              ),
            ],
          ),
        ),
      ],
    ),
  );

  @override
  Widget build(BuildContext context) {
    final ponto = _ponto;
    final materiais = materiaisDoPonto(
      ponto ?? const PontoColeta(id: 0, latitude: 0, longitude: 0),
    );
    final endereco = ponto?.endereco ?? 'Endereço não informado';
    final enderecoCompleto =
        ponto?.complemento != null && ponto!.complemento!.isNotEmpty
        ? '$endereco — ${ponto.complemento}'
        : endereco;
    final pesoTemValor =
        ponto?.pesoMinimoKg != null || ponto?.pesoMaximoKg != null;
    final domicilio =
        (ponto?.coletaDomicilio == false ? 'Não disponível' : 'Disponível') +
        (pesoTemValor
            ? ' · ${_pesoLabel(ponto?.pesoMinimoKg ?? 0)} kg a ${_pesoLabel(ponto?.pesoMaximoKg)} kg'
            : '');

    return AppScaffold(
      currentPath: '/detalhes-ponto',
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          SolusBackButton(onPressed: () => go(context, '/mapa')),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(Solus.radius),
            child: SizedBox(
              height: 180,
              width: double.infinity,
              child: (ponto?.imagemUrl != null && ponto!.imagemUrl!.isNotEmpty)
                  ? Image.network(
                      ponto.imagemUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => Image.asset(
                        'assets/images/imagem-galpao.png',
                        fit: BoxFit.cover,
                      ),
                    )
                  : Image.asset(
                      'assets/images/imagem-galpao.png',
                      fit: BoxFit.cover,
                    ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            ponto?.nome ??
                (_carregando ? 'Carregando...' : 'Organização de reciclagem'),
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
          ),
          if (ponto?.companyNome != null && ponto!.companyNome!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                ponto.companyNome!,
                style: const TextStyle(fontSize: 14, color: Solus.muted),
              ),
            ),
          const SizedBox(height: 14),
          _infoRow(LucideIcons.mapPin, 'Endereço', enderecoCompleto),
          _infoRow(
            LucideIcons.clock3,
            'Funcionamento',
            rotuloFuncionamento(ponto?.funcionamento ?? const []),
          ),
          _infoRow(
            LucideIcons.recycle,
            'Materiais aceitos',
            materiais.isEmpty ? 'Recicláveis em geral' : materiais.join(', '),
          ),
          _infoRow(LucideIcons.truck, 'Coleta em domicílio', domicilio),
          const SizedBox(height: 24),
          SolusButton(
            'Agendar coleta',
            icon: LucideIcons.calendarDays,
            minWidth: double.infinity,
            onPressed: () => go(context, '/agendamento', {
              'empresa': ponto?.companyId?.toString() ?? '',
              'ponto': _pontoId,
            }),
          ),
        ],
      ),
    );
  }
}
