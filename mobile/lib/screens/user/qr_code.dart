import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../app.dart';
import '../../models.dart';
import '../../theme.dart';
import '../../services/api.dart';
import '../../widgets/ui.dart';

class QrCodeUsuarioScreen extends StatefulWidget {
  const QrCodeUsuarioScreen({super.key});

  @override
  State<QrCodeUsuarioScreen> createState() => _QrCodeUsuarioScreenState();
}

class _QrCodeUsuarioScreenState extends State<QrCodeUsuarioScreen> {
  static const int validadeSegundos = 10 * 60;

  Timer? _timer;
  List<Agendamento> _agendamentos = const [];
  int _restante = validadeSegundos;
  int _geracao = DateTime.now().millisecondsSinceEpoch;
  String _erro = '';
  bool _carregando = true;

  @override
  void initState() {
    super.initState();
    _carregar();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted || _restante == 0) return;
      setState(() => _restante--);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _carregar() async {
    final resultado = await ApiClient.meusAgendamentos();
    if (!mounted) return;
    setState(() {
      if (resultado.error != null) {
        _erro = resultado.error!;
      } else {
        _agendamentos = (resultado.data ?? const <Agendamento>[])
            .where((item) => item.pendente || item.confirmado)
            .toList();
      }
      _carregando = false;
    });
  }

  Agendamento? get _coleta {
    final alvo = int.tryParse(paramsOf(context)['coleta'] ?? '');
    if (alvo != null) {
      final selecionada = _agendamentos.cast<Agendamento?>().firstWhere(
        (item) => item?.id == alvo,
        orElse: () => null,
      );
      if (selecionada != null) return selecionada;
    }
    return _agendamentos.cast<Agendamento?>().firstWhere(
      (item) => item?.confirmado ?? false,
      orElse: () => _agendamentos.isEmpty ? null : _agendamentos.first,
    );
  }

  String _relogio(int segundos) {
    final minutos = segundos ~/ 60;
    return '${minutos.toString().padLeft(2, '0')}:${(segundos % 60).toString().padLeft(2, '0')}';
  }

  String _pesoLabel(double? valor) {
    final peso = valor ?? 0;
    return peso == peso.roundToDouble()
        ? peso.round().toString()
        : peso.toStringAsFixed(1).replaceAll('.', ',');
  }

  void _atualizarQr() => setState(() {
    _geracao = DateTime.now().millisecondsSinceEpoch;
    _restante = validadeSegundos;
  });

  @override
  Widget build(BuildContext context) {
    final coleta = _coleta;
    final expirado = _restante == 0;

    return AppScaffold(
      currentPath: '/qr-code',
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 30),
        children: [
          SolusBackButton(
            onPressed: () => go(context, '/confirmacao-agendamento'),
          ),
          const SizedBox(height: 10),
          const Text(
            'Confirmar coleta',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          const Text(
            'Mostre este QR para a empresa',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Solus.muted),
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
          if (_carregando)
            const LoadingView(label: 'Carregando...')
          else if (coleta == null) ...[
            EmptyState(
              'Você ainda não tem uma coleta para confirmar.',
              icon: LucideIcons.qrCode,
            ),
            const SizedBox(height: 16),
            SolusButton(
              'Ver minhas coletas',
              minWidth: double.infinity,
              onPressed: () => go(context, '/confirmacao-agendamento'),
            ),
          ] else ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 22),
              decoration: BoxDecoration(
                color: Solus.surface,
                border: Border.all(color: Solus.border),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                children: [
                  QrImageView(
                    data:
                        'SOLUS|coleta=${coleta.id}|geracao=$_geracao|valido=$validadeSegundos',
                    version: QrVersions.auto,
                    size: 252,
                    backgroundColor: Colors.white,
                    eyeStyle: const QrEyeStyle(
                      eyeShape: QrEyeShape.square,
                      color: Color(0xFF111111),
                    ),
                    dataModuleStyle: const QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: Color(0xFF111111),
                    ),
                    errorCorrectionLevel: QrErrorCorrectLevel.M,
                    semanticsLabel: 'QR da coleta ${coleta.id}',
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Coleta #${coleta.id}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: expirado
                          ? const Color(0xFFFFF0F0)
                          : Solus.greenSoft,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          LucideIcons.clock3,
                          size: 15,
                          color: expirado ? Solus.danger : Solus.greenDark,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          expirado
                              ? 'Código expirado'
                              : 'Válido por ${_relogio(_restante)}',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: expirado ? Solus.danger : Solus.greenDark,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(
                      LucideIcons.mapPin,
                      size: 17,
                      color: Solus.greenDark,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        coleta.companyNomeFantasia ?? 'Solus Reciclagem',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(
                      LucideIcons.recycle,
                      size: 17,
                      color: Solus.greenDark,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '${coleta.tipoResiduo ?? 'Recicláveis'} · ${_pesoLabel(coleta.pesoEstimado)} kg',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Text(
                'A empresa escaneia este código para confirmar o recebimento dos materiais.',
                style: TextStyle(fontSize: 11, color: Solus.muted, height: 1.5),
              ),
            ),
            SolusButton(
              'Atualizar QR',
              icon: LucideIcons.refreshCw,
              minWidth: double.infinity,
              onPressed: _atualizarQr,
            ),
          ],
        ],
      ),
    );
  }
}
