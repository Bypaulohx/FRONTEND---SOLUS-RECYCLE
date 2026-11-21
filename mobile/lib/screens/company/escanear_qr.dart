import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
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

String _iniciais(String? nome) {
  final valor = nome ?? 'US';
  return valor.substring(0, valor.length > 2 ? 2 : valor.length).toUpperCase();
}

int? _extrairId(String valor) {
  final nomeado = RegExp(
    r'coleta\s*[=:]\s*(\d+)',
    caseSensitive: false,
  ).firstMatch(valor)?.group(1);
  final numero = nomeado ?? RegExp(r'(\d+)').firstMatch(valor)?.group(0);
  final id = int.tryParse(numero ?? '');
  return id != null && id > 0 ? id : null;
}

/// Espelho de frontend/src/pages/EscanearQr.tsx — câmera real + fallback manual.
class EscanearQrScreen extends StatefulWidget {
  final Map<String, String> params;

  const EscanearQrScreen({super.key, required this.params});

  @override
  State<EscanearQrScreen> createState() => _EscanearQrScreenState();
}

class _EscanearQrScreenState extends State<EscanearQrScreen> {
  final TextEditingController _codigoController = TextEditingController();
  final TextEditingController _pesoController = TextEditingController();
  final ImagePicker _imagePicker = ImagePicker();
  final List<Agendamento> _agendamentos = <Agendamento>[];
  late final MobileScannerController _scannerController;

  XFile? _foto;
  int? _coletaId;
  String _statusCamera = 'Solicitando acesso à câmera…';
  String _erro = '';
  String _sucesso = '';
  bool _processando = false;

  @override
  void initState() {
    super.initState();
    _scannerController = MobileScannerController(facing: CameraFacing.back);
    _scannerController.addListener(_onScannerStateChanged);
    _carregar();
  }

  @override
  void dispose() {
    _scannerController.removeListener(_onScannerStateChanged);
    _scannerController.dispose();
    _codigoController.dispose();
    _pesoController.dispose();
    super.dispose();
  }

  Future<void> _carregar() async {
    final session = context.read<Session>();
    final companyId =
        session.me?.id ??
        int.tryParse(await Prefs.read(Prefs.companyIdKey) ?? '') ??
        0;
    final resultado = await ApiClient.agendamentosDaEmpresa(companyId);
    if (!mounted) return;
    if (resultado.error != null || resultado.data == null) {
      setState(() {
        _erro = resultado.error ?? 'Não foi possível carregar as coletas.';
      });
      return;
    }
    setState(() {
      _agendamentos
        ..clear()
        ..addAll(resultado.data!);
    });
    final param = widget.params['coleta'];
    if (param != null && param.isNotEmpty) _usarCodigo(param);
  }

  void _onScannerStateChanged() {
    if (!mounted || _coletaId != null) return;
    final state = _scannerController.value;
    if (state.error != null) {
      const texto =
          'Não foi possível abrir a câmera. Use a leitura manual abaixo.';
      if (_statusCamera != texto) setState(() => _statusCamera = texto);
      return;
    }
    if (state.isRunning) {
      const texto = 'Aponte a câmera para o QR do usuário';
      if (_statusCamera != texto) setState(() => _statusCamera = texto);
    }
  }

  void _onDetect(BarcodeCapture capture) {
    if (_coletaId != null || _processando || capture.barcodes.isEmpty) return;
    final valor = capture.barcodes.first.rawValue;
    if (valor == null || valor.isEmpty) return;
    _usarCodigo(valor);
  }

  void _usarCodigo(String valor) {
    final id = _extrairId(valor);
    if (id == null) {
      setState(() => _erro = 'Código inválido. Informe o QR da coleta.');
      return;
    }
    Agendamento? coleta;
    for (final item in _agendamentos) {
      if (item.id == id) {
        coleta = item;
        break;
      }
    }
    setState(() {
      _erro = '';
      _sucesso = '';
      _coletaId = id;
      _codigoController.text = '$id';
      if (coleta != null) {
        _pesoController.text = coleta.pesoEstimado?.toString() ?? '';
        _statusCamera = 'Coleta #$id lida. Confira os dados abaixo.';
      } else {
        _statusCamera = 'Código $id lido. Aguardando os dados da coleta.';
      }
    });
    if (_scannerController.value.isRunning) {
      unawaited(_scannerController.stop());
    }
  }

  Future<void> _escolherFoto() async {
    final arquivo = await _imagePicker.pickImage(
      source: ImageSource.camera,
      imageQuality: 80,
    );
    if (arquivo == null || !mounted) return;
    setState(() => _foto = arquivo);
  }

  Future<void> _confirmar() async {
    Agendamento? coleta;
    for (final item in _agendamentos) {
      if (item.id == _coletaId) {
        coleta = item;
        break;
      }
    }
    if (coleta == null) {
      setState(
        () => _erro =
            'Leia o QR ou informe o número da coleta antes de confirmar.',
      );
      return;
    }
    final pesoNumero = double.tryParse(
      _pesoController.text.replaceAll(',', '.'),
    );
    if (pesoNumero == null || pesoNumero <= 0) {
      setState(() => _erro = 'Informe o peso real recebido.');
      return;
    }

    setState(() {
      _processando = true;
      _erro = '';
    });
    final resultado = await ApiClient.concluirAgendamento(coleta.id);
    if (!mounted) return;
    if (resultado.error != null) {
      setState(() {
        _processando = false;
        _erro = resultado.error ?? 'Não foi possível concluir a coleta.';
      });
      return;
    }

    final idConfirmado = coleta.id;
    final material = coleta.tipoResiduo ?? 'Recicláveis';
    final pontos = pointsForWeight(pesoNumero);
    await LocalData.addCollectionCredit(pontos, material, coleta.id);
    await LocalData.addMaterialLot({
      'id': 'L-${coleta.id}',
      'material': material,
      'weightKg': pesoNumero,
      'origin': coleta.userName ?? 'Usuário Solus',
      'date': ddmmNow(),
      'destination': 'Recicladora parceira',
    });
    if (!mounted) return;
    setState(() {
      _processando = false;
      _sucesso =
          'Coleta #$idConfirmado concluída. '
          '$pontos pontos liberados para o usuário.';
    });
  }

  @override
  Widget build(BuildContext context) {
    Agendamento? coleta;
    for (final item in _agendamentos) {
      if (item.id == _coletaId) {
        coleta = item;
        break;
      }
    }

    return AppScaffold(
      currentPath: '/escanear-qr',
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 30),
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: SolusBackButton(
              onPressed: () => go(context, '/agenda-empresa'),
            ),
          ),
          const Text(
            'Escanear QR',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          const Text(
            'Aponte para o código do usuário',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Solus.muted),
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 260,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: Stack(
                children: [
                  Positioned.fill(
                    child: MobileScanner(
                      controller: _scannerController,
                      onDetect: _onDetect,
                      onDetectError: (error, stackTrace) {
                        if (!mounted || _coletaId != null) return;
                        setState(
                          () => _statusCamera = 'Câmera ativa. Leitura automática indisponível — informe o código abaixo.',
                        );
                      },
                      errorBuilder: (context, error) {
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          if (!mounted || _coletaId != null) return;
                          setState(
                            () => _statusCamera = 'Não foi possível abrir a câmera. Use a leitura manual abaixo.',
                          );
                        });
                        return const Center(
                          child: Icon(
                            LucideIcons.camera,
                            size: 40,
                            color: Colors.white70,
                          ),
                        );
                      },
                    ),
                  ),
                  const Positioned.fill(
                    left: 46,
                    right: 46,
                    top: 42,
                    bottom: 42,
                    child: IgnorePointer(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          border: Border.fromBorderSide(
                            BorderSide(color: Solus.green, width: 3),
                          ),
                          borderRadius: BorderRadius.all(Radius.circular(14)),
                        ),
                        child: Center(
                          child: Icon(
                            LucideIcons.scanLine,
                            size: 30,
                            color: Solus.green,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    left: 8,
                    right: 8,
                    bottom: 8,
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 7,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: .42),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              LucideIcons.camera,
                              size: 14,
                              color: Colors.white,
                            ),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                _statusCamera,
                                style: const TextStyle(
                                  fontSize: 10,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_erro.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Text(
                _erro,
                style: const TextStyle(fontSize: 13, color: Solus.danger),
              ),
            ),
          if (_sucesso.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Text(
                _sucesso,
                style: const TextStyle(fontSize: 13, color: Solus.greenDark),
              ),
            ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FCF9),
              border: Border.all(color: Solus.border),
              borderRadius: BorderRadius.circular(Solus.radius),
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: const BoxDecoration(
                    color: Solus.greenSoft,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    _iniciais(coleta?.userName),
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: Solus.greenDark,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        coleta == null
                            ? 'Aguardando leitura'
                            : '${coleta.userName ?? 'Morador'} · Coleta #${coleta.id}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        coleta == null
                            ? 'Leia o QR exibido pelo usuário'
                            : '${coleta.tipoResiduo ?? 'Recicláveis'} · '
                                  '${oneDecimal(coleta.pesoEstimado)} kg estimados',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Solus.muted,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _codigoController,
            keyboardType: TextInputType.number,
            decoration: Solus.field('Código da coleta', hint: 'Ex.: 1042'),
          ),
          const SizedBox(height: 8),
          MiniButton(
            'Ler código',
            icon: LucideIcons.scanLine,
            variant: MiniButtonStyle.outline,
            onPressed: () => _usarCodigo(_codigoController.text),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _pesoController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: Solus.field('Peso real', hint: '0,0 kg'),
          ),
          GestureDetector(
            onTap: _escolherFoto,
            child: Container(
              width: double.infinity,
              constraints: const BoxConstraints(minHeight: 86),
              margin: const EdgeInsets.symmetric(vertical: 14),
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                border: Border.all(color: Solus.inactive),
                borderRadius: BorderRadius.circular(Solus.radius),
              ),
              child: _foto == null
                  ? const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          LucideIcons.imagePlus,
                          size: 22,
                          color: Solus.muted,
                        ),
                        SizedBox(height: 6),
                        Text(
                          'Foto do material',
                          style: TextStyle(fontSize: 11, color: Solus.muted),
                        ),
                      ],
                    )
                  : Image.file(
                      File(_foto!.path),
                      height: 120,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
            ),
          ),
          if (_sucesso.isEmpty)
            SolusButton(
              _processando ? 'Confirmando…' : 'Confirmar recebimento',
              icon: LucideIcons.check,
              loading: _processando,
              onPressed: _processando ? null : _confirmar,
            )
          else
            SolusButton(
              'Ver materiais e impacto',
              outlined: true,
              onPressed: () => go(context, '/materiais-empresa'),
            ),
        ],
      ),
    );
  }
}
