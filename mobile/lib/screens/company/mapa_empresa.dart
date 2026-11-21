import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../../models.dart';
import '../../providers/session.dart';
import '../../services/api.dart';
import '../../services/storage.dart';
import '../../theme.dart';
import '../../utils/format.dart';
import '../../widgets/ui.dart';

/// Espelho de frontend/src/pages/MapaEmpresa.tsx.
class MapaEmpresaScreen extends StatefulWidget {
  const MapaEmpresaScreen({super.key});

  @override
  State<MapaEmpresaScreen> createState() => _MapaEmpresaScreenState();
}

class _ConfigPonto {
  String complemento;
  double raioKm;
  String materiais;
  String pesoMinimo;
  String pesoMaximo;
  bool recebeMateriais;
  bool coletaDomicilio;
  List<Funcionamento> funcionamento;

  _ConfigPonto({
    this.complemento = '',
    this.raioKm = 5,
    this.materiais = '',
    this.pesoMinimo = '',
    this.pesoMaximo = '',
    this.recebeMateriais = true,
    this.coletaDomicilio = true,
    this.funcionamento = const <Funcionamento>[],
  });
}

class _MapaEmpresaScreenState extends State<MapaEmpresaScreen> {
  final MapController _mapController = MapController();
  final TextEditingController _enderecoController = TextEditingController();
  final TextEditingController _complementoController = TextEditingController();
  final TextEditingController _materiaisController = TextEditingController();
  final TextEditingController _pesoMinController = TextEditingController();
  final TextEditingController _pesoMaxController = TextEditingController();

  final List<PontoColeta> _pontos = <PontoColeta>[];
  PontoColeta? _selecionado;
  String _endereco = '';
  LatLng _posicao = const LatLng(-23.5505, -46.6333);
  _ConfigPonto _config = _ConfigPonto();
  String _mensagem = '';
  String _erro = '';
  bool _salvando = false;
  int _companyId = 0;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  @override
  void dispose() {
    _enderecoController.dispose();
    _complementoController.dispose();
    _materiaisController.dispose();
    _pesoMinController.dispose();
    _pesoMaxController.dispose();
    super.dispose();
  }

  Future<void> _carregar() async {
    final session = context.read<Session>();
    _companyId =
        session.me?.id ??
        int.tryParse(await Prefs.read(Prefs.companyIdKey) ?? '') ??
        0;
    final resultado = await ApiClient.pontos();
    if (!mounted) return;
    if (resultado.error != null || resultado.data == null) {
      setState(() {
        _erro = resultado.error ?? 'Não foi possível carregar os pontos.';
      });
      return;
    }
    final validos = resultado.data!
        .where((ponto) => ponto.latitude.isFinite && ponto.longitude.isFinite)
        .toList();
    final meus = validos
        .where((ponto) => ponto.companyId == _companyId)
        .toList();
    setState(() {
      _pontos
        ..clear()
        ..addAll(validos);
      if (meus.isNotEmpty) _aplicarPonto(meus.first);
    });
  }

  List<PontoColeta> get _meusPontos =>
      _pontos.where((ponto) => ponto.companyId == _companyId).toList();

  void _aplicarPonto(PontoColeta ponto, {bool moverMapa = true}) {
    final materiais = ponto.materiais.isNotEmpty
        ? ponto.materiais
        : (ponto.tipoResiduo ?? '').split(RegExp(r'[,;]'));
    _selecionado = ponto;
    _posicao = LatLng(ponto.latitude, ponto.longitude);
    _config = _ConfigPonto(
      complemento: ponto.complemento ?? '',
      raioKm: ponto.raioKm ?? 5,
      materiais: materiais
          .map((item) => item.trim())
          .where((item) => item.isNotEmpty)
          .join(', '),
      pesoMinimo: ponto.pesoMinimoKg?.toString() ?? '',
      pesoMaximo: ponto.pesoMaximoKg?.toString() ?? '',
      recebeMateriais: ponto.recebeMateriais ?? true,
      coletaDomicilio: ponto.coletaDomicilio ?? true,
      funcionamento: ponto.funcionamento
          .map(
            (f) => Funcionamento(
              id: f.id,
              diaSemana: f.diaSemana,
              horarioAbertura: f.horarioAbertura,
              horarioFechamento: f.horarioFechamento,
            ),
          )
          .toList(),
    );
    _endereco = ponto.endereco ?? '';
    _enderecoController.text = _endereco;
    _complementoController.text = _config.complemento;
    _materiaisController.text = _config.materiais;
    _pesoMinController.text = _config.pesoMinimo;
    _pesoMaxController.text = _config.pesoMaximo;
    if (moverMapa) _mapController.move(_posicao, 15);
  }

  void _selecionarPonto(PontoColeta ponto) {
    setState(() {
      _aplicarPonto(ponto);
      _mensagem = '';
      _erro = '';
    });
  }

  void _arrastarPin(BuildContext context, Offset delta) {
    final camera = MapCamera.of(context);
    final destino = camera.latLngToScreenOffset(_posicao) + delta;
    setState(() {
      _posicao = camera.screenOffsetToLatLng(destino);
    });
  }

  void _atualizarHorario(int index, Funcionamento proximo) {
    setState(() {
      _config.funcionamento[index] = proximo;
    });
  }

  Future<void> _salvar() async {
    final ponto = _selecionado;
    if (ponto == null) return;
    setState(() {
      _salvando = true;
      _erro = '';
      _mensagem = '';
    });
    final materiais = _config.materiais
        .split(',')
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList();
    final minimo = double.tryParse(_config.pesoMinimo.replaceAll(',', '.'));
    final maximo = double.tryParse(_config.pesoMaximo.replaceAll(',', '.'));
    final resultado = await ApiClient.atualizarPonto(ponto.id, {
      'nome': ponto.nome ?? 'Ponto de coleta',
      'tipoResiduo': ponto.tipoResiduo ?? 'Recicláveis',
      'endereco': _endereco,
      'latitude': _posicao.latitude,
      'longitude': _posicao.longitude,
      'complemento': _config.complemento,
      'raioKm': _config.raioKm,
      'materiais': materiais,
      'pesoMinimoKg': minimo,
      'pesoMaximoKg': maximo,
      'recebeMateriais': _config.recebeMateriais,
      'coletaDomicilio': _config.coletaDomicilio,
      'funcionamento': _config.funcionamento
          .map(
            (f) => <String, dynamic>{
              if (f.id != null) 'id': f.id,
              'diaSemana': f.diaSemana ?? '',
              'horarioAbertura': f.horarioAbertura ?? '',
              'horarioFechamento': f.horarioFechamento ?? '',
            },
          )
          .toList(),
    });
    if (!mounted) return;
    setState(() {
      _salvando = false;
      if (resultado.error != null || resultado.data == null) {
        _erro = resultado.error ?? 'Não foi possível salvar o ponto.';
        return;
      }
      final atualizado = resultado.data!;
      final indice = _pontos.indexWhere((item) => item.id == atualizado.id);
      if (indice >= 0) _pontos[indice] = atualizado;
      _aplicarPonto(atualizado);
      _mensagem = 'Configurações salvas para este ponto.';
    });
  }

  String get _raioTexto {
    final raio = _config.raioKm;
    return raio == raio.roundToDouble()
        ? raio.toInt().toString()
        : oneDecimal(raio);
  }

  @override
  Widget build(BuildContext context) {
    final meus = _meusPontos;
    return AppScaffold(
      currentPath: '/mapa-empresa',
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 30),
        children: [
          PageTitle(
            eyebrow: 'Mapa operacional',
            title: 'Editar ponto de coleta',
            subtitle: 'Arraste o pino para marcar o local exato',
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Solus.greenSoft,
              borderRadius: BorderRadius.circular(Solus.radius),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 1),
                  child: Icon(
                    LucideIcons.info,
                    size: 17,
                    color: Solus.greenDark,
                  ),
                ),
                const SizedBox(width: 9),
                Expanded(
                  child: RichText(
                    text: const TextSpan(
                      style: TextStyle(
                        fontSize: 11,
                        color: Solus.ink,
                        height: 1.5,
                      ),
                      children: [
                        TextSpan(text: 'Um '),
                        TextSpan(
                          text: 'ponto',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                        TextSpan(
                          text:
                              ' é cada local físico onde sua organização recebe materiais. '
                              'Você pode ter vários pontos (galpão, unidade, feira); cada um '
                              'tem endereço, raio, materiais e pesos próprios. Outros pontos '
                              'que aparecem no mapa pertencem a outras empresas e não podem '
                              'ser editados aqui.',
                        ),
                      ],
                    ),
                  ),
                ),
              ],
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
          if (_mensagem.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(
                _mensagem,
                style: const TextStyle(fontSize: 13, color: Solus.greenDark),
              ),
            ),
          const SizedBox(height: 16),
          SizedBox(
            height: 300,
            child: Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: FlutterMap(
                    mapController: _mapController,
                    options: MapOptions(
                      initialCenter: _posicao,
                      initialZoom: 15,
                      backgroundColor: const Color(0xFFE8EBE8),
                    ),
                    children: [
                      TileLayer(
                        urlTemplate:
                            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                        userAgentPackageName: 'com.solus.recycle',
                        maxZoom: 19,
                      ),
                      CircleLayer(
                        circles: [
                          CircleMarker(
                            point: _posicao,
                            radius: _config.raioKm * 1000,
                            useRadiusInMeter: true,
                            color: Solus.green.withValues(alpha: .08),
                            borderColor: Solus.green,
                            borderStrokeWidth: 1,
                          ),
                        ],
                      ),
                      MarkerLayer(
                        markers: [
                          for (final ponto in _pontos)
                            if (ponto.companyId != _companyId &&
                                ponto.id != _selecionado?.id)
                              Marker(
                                point: LatLng(ponto.latitude, ponto.longitude),
                                width: 24,
                                height: 24,
                                child: const _Pin(secundario: true),
                              ),
                          for (final ponto in meus)
                            if (ponto.id != _selecionado?.id)
                              Marker(
                                point: LatLng(ponto.latitude, ponto.longitude),
                                width: 24,
                                height: 24,
                                child: GestureDetector(
                                  onTap: () => _selecionarPonto(ponto),
                                  child: _Pin(
                                    secundario: true,
                                    tooltip: ponto.nome ?? 'Ponto #${ponto.id}',
                                  ),
                                ),
                              ),
                          Marker(
                            point: _posicao,
                            width: 36,
                            height: 44,
                            alignment: Alignment.topCenter,
                            child: Builder(
                              builder: (markerContext) => GestureDetector(
                                onPanUpdate: (details) =>
                                    _arrastarPin(markerContext, details.delta),
                                onPanEnd: (_) =>
                                    _arrastarPin(markerContext, Offset.zero),
                                child: const _Pin(),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Positioned(
                  top: 12,
                  left: 12,
                  child: _mapPill('Raio de $_raioTexto km'),
                ),
                Positioned(
                  bottom: 12,
                  left: 12,
                  child: _mapPill('Arraste o pino', drag: true),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (meus.length > 1) ...[
                const Text(
                  'Ponto desta organização',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Solus.muted,
                  ),
                ),
                const SizedBox(height: 6),
                DropdownButtonFormField<int>(
                  initialValue: _selecionado?.id ?? meus.first.id,
                  decoration: Solus.field('Ponto desta organização'),
                  items: [
                    for (final ponto in meus)
                      DropdownMenuItem<int>(
                        value: ponto.id,
                        child: Text(ponto.nome ?? 'Ponto #${ponto.id}'),
                      ),
                  ],
                  onChanged: (id) {
                    final ponto = meus
                        .where((item) => item.id == id)
                        .cast<PontoColeta?>()
                        .firstOrNull;
                    if (ponto != null) _selecionarPonto(ponto);
                  },
                ),
                const SizedBox(height: 13),
              ],
              if (meus.isEmpty)
                const Padding(
                  padding: EdgeInsets.only(bottom: 13),
                  child: Text(
                    'Nenhum ponto cadastrado para esta organização. Os pontos exibidos no mapa pertencem a outras empresas e não podem ser editados aqui.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Solus.muted,
                      fontStyle: FontStyle.italic,
                      height: 1.5,
                    ),
                  ),
                ),
              TextField(
                controller: _enderecoController,
                enabled: _selecionado != null,
                onChanged: (value) => _endereco = value,
                decoration: Solus.field('Endereço'),
              ),
              const SizedBox(height: 13),
              TextField(
                controller: _complementoController,
                enabled: _selecionado != null,
                onChanged: (value) => _config.complemento = value,
                decoration: Solus.field(
                  'Complemento deste ponto',
                  hint: 'Ex.: Galpão 2, entrada pela lateral',
                ),
              ),
              const SizedBox(height: 13),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Raio de atendimento',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  Text(
                    '$_raioTexto km',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: Solus.greenDark,
                    ),
                  ),
                ],
              ),
              Slider(
                value: _config.raioKm.clamp(1.0, 20.0),
                min: 1,
                max: 20,
                divisions: 19,
                label: '$_raioTexto km',
                onChanged: _selecionado == null
                    ? null
                    : (value) => setState(() => _config.raioKm = value),
              ),
              TextField(
                controller: _materiaisController,
                enabled: _selecionado != null,
                onChanged: (value) => _config.materiais = value,
                decoration: Solus.field(
                  'Materiais aceitos neste ponto',
                  hint: 'Papel, Plástico, Vidro',
                ),
              ),
              const SizedBox(height: 13),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _pesoMinController,
                      enabled: _selecionado != null,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      onChanged: (value) => _config.pesoMinimo = value,
                      decoration: Solus.field('Peso mín. (kg)'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _pesoMaxController,
                      enabled: _selecionado != null,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      onChanged: (value) => _config.pesoMaximo = value,
                      decoration: Solus.field('Peso máx. (kg)'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Recebe materiais',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  Switch(
                    value: _config.recebeMateriais,
                    onChanged: _selecionado == null
                        ? null
                        : (value) =>
                              setState(() => _config.recebeMateriais = value),
                  ),
                ],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Coleta em domicílio',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  Switch(
                    value: _config.coletaDomicilio,
                    onChanged: _selecionado == null
                        ? null
                        : (value) =>
                              setState(() => _config.coletaDomicilio = value),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              SectionTitle(
                'Horários deste ponto',
                margin: EdgeInsets.zero,
                action: LinkAction(
                  'Adicionar',
                  _selecionado == null
                      ? () {}
                      : () => setState(() {
                          _config.funcionamento.add(
                            const Funcionamento(
                              diaSemana: 'Seg. a sex.',
                              horarioAbertura: '08:00',
                              horarioFechamento: '17:00',
                            ),
                          );
                        }),
                  icon: LucideIcons.plus,
                ),
              ),
              const SizedBox(height: 10),
              for (var i = 0; i < _config.funcionamento.length; i++)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _HorarioRow(
                    horario: _config.funcionamento[i],
                    onChanged: (proximo) => _atualizarHorario(i, proximo),
                    onRemove: () => setState(() {
                      _config.funcionamento.removeAt(i);
                    }),
                  ),
                ),
              const SizedBox(height: 18),
              SolusButton(
                _salvando ? 'Salvando…' : 'Salvar este ponto',
                icon: LucideIcons.save,
                loading: _salvando,
                onPressed: _salvando || _selecionado == null ? null : _salvar,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _mapPill(String texto, {bool drag = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
      decoration: BoxDecoration(
        color: Solus.surface,
        border: Border.all(color: Solus.border),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (drag) ...[
            const Icon(LucideIcons.gripVertical, size: 14, color: Solus.muted),
            const SizedBox(width: 5),
          ],
          Text(
            texto,
            style: TextStyle(
              fontSize: 10,
              fontWeight: drag ? FontWeight.w500 : FontWeight.w700,
              color: drag ? Solus.muted : Solus.ink,
            ),
          ),
        ],
      ),
    );
  }
}

class _Pin extends StatelessWidget {
  final bool secundario;
  final String? tooltip;

  const _Pin({this.secundario = false, this.tooltip});

  @override
  Widget build(BuildContext context) {
    final cor = secundario ? Solus.inactive : Solus.green;
    final pino = Transform.rotate(
      angle: -math.pi / 4,
      child: Container(
        width: secundario ? 20 : 30,
        height: secundario ? 20 : 30,
        decoration: BoxDecoration(
          color: cor,
          border: Border.all(color: Colors.white, width: 3),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(50),
            topRight: Radius.circular(50),
            bottomLeft: Radius.circular(50),
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x44000000),
              blurRadius: 6,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: Center(
          child: Container(
            width: secundario ? 6 : 8,
            height: secundario ? 6 : 8,
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
          ),
        ),
      ),
    );
    if (tooltip == null) return pino;
    return Tooltip(message: tooltip!, child: pino);
  }
}

class _HorarioRow extends StatefulWidget {
  final Funcionamento horario;
  final ValueChanged<Funcionamento> onChanged;
  final VoidCallback onRemove;

  const _HorarioRow({
    required this.horario,
    required this.onChanged,
    required this.onRemove,
  });

  @override
  State<_HorarioRow> createState() => _HorarioRowState();
}

class _HorarioRowState extends State<_HorarioRow> {
  late final TextEditingController _dia = TextEditingController(
    text: widget.horario.diaSemana ?? '',
  );
  late final TextEditingController _abertura = TextEditingController(
    text: widget.horario.horarioAbertura ?? '',
  );
  late final TextEditingController _fechamento = TextEditingController(
    text: widget.horario.horarioFechamento ?? '',
  );

  @override
  void dispose() {
    _dia.dispose();
    _abertura.dispose();
    _fechamento.dispose();
    super.dispose();
  }

  void _emitir() => widget.onChanged(
    Funcionamento(
      id: widget.horario.id,
      diaSemana: _dia.text,
      horarioAbertura: _abertura.text,
      horarioFechamento: _fechamento.text,
    ),
  );

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _dia,
            onChanged: (_) => _emitir(),
            decoration: Solus.field('Dias da semana'),
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: TextField(
            controller: _abertura,
            onChanged: (_) => _emitir(),
            decoration: Solus.field('Abertura'),
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: TextField(
            controller: _fechamento,
            onChanged: (_) => _emitir(),
            decoration: Solus.field('Fechamento'),
          ),
        ),
        IconButton(
          onPressed: widget.onRemove,
          tooltip: 'Remover horário',
          icon: const Icon(LucideIcons.trash2, size: 16, color: Solus.danger),
        ),
      ],
    );
  }
}
