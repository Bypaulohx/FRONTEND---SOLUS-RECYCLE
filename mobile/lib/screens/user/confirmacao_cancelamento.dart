import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../app.dart';
import '../../services/api.dart';
import '../../theme.dart';
import '../../widgets/ui.dart';

class ConfirmacaoCancelamentoScreen extends StatefulWidget {
  final Map<String, String> params;

  const ConfirmacaoCancelamentoScreen({super.key, required this.params});

  @override
  State<ConfirmacaoCancelamentoScreen> createState() =>
      _ConfirmacaoCancelamentoScreenState();
}

class _ConfirmacaoCancelamentoScreenState
    extends State<ConfirmacaoCancelamentoScreen> {
  String _estado = 'idle';
  String _erro = '';

  @override
  void initState() {
    super.initState();
    final valor = widget.params['id'] ?? widget.params['agendamentoId'] ?? '';
    final id = int.tryParse(valor);
    if (id == null) {
      _estado = 'erro';
      _erro = 'Nenhum agendamento foi selecionado.';
    } else {
      _cancelar(id);
    }
  }

  Future<void> _cancelar(int id) async {
    final resultado = await ApiClient.cancelarAgendamento(id);
    if (!mounted) return;
    setState(() {
      if (resultado.error != null) {
        _erro = resultado.error!;
        _estado = 'erro';
      } else {
        _estado = 'ok';
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final ok = _estado == 'ok';
    final titulo = ok
        ? 'Agendamento cancelado com sucesso!'
        : _estado == 'erro'
        ? 'Não foi possível cancelar'
        : 'Cancelando agendamento...';

    return AppScaffold(
      currentPath: '/confirmacao-cancelamento',
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 0),
            child: Align(
              alignment: Alignment.centerLeft,
              child: SolusBackButton(
                onPressed: () => go(context, '/confirmacao-agendamento'),
              ),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Icon(
                    ok ? LucideIcons.circleCheckBig : LucideIcons.circleAlert,
                    size: 88,
                    color: ok ? Solus.green : Solus.danger,
                  ),
                  const SizedBox(height: 24),
                  Text(
                    titulo,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w700,
                      height: 1.25,
                    ),
                  ),
                  if (_estado == 'erro' && _erro.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Text(
                        _erro,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Solus.danger,
                        ),
                      ),
                    ),
                  const SizedBox(height: 24),
                  SolusButton(
                    'Ir para o início',
                    minWidth: 200,
                    onPressed: () => goHome(context),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
