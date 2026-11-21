import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../app.dart';
import '../../models.dart';
import '../../theme.dart';
import '../../services/api.dart';
import '../../utils/format.dart';
import '../../utils/geo.dart';
import '../../widgets/ui.dart';

class MapaScreen extends StatefulWidget {
  const MapaScreen({super.key});

  @override
  State<MapaScreen> createState() => _MapaScreenState();
}

class _MapaScreenState extends State<MapaScreen> {
  static const _centroPadrao = LatLng(-23.5505, -46.6333);
  static const _raios = [5, 10, 20, 40];

  final _mapController = MapController();
  final _sheetController = DraggableScrollableController();
  final _termoController = TextEditingController();

  List<PontoColeta> _pontos = const [];
  LatLng _centro = _centroPadrao;
  bool _carregando = true;
  bool _buscando = false;
  bool _filtrosAbertos = false;
  bool _expanded = false;
  String _mensagem = '';
  String _material = '';
  int _raio = 40;
  bool _somenteAbertos = false;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  @override
  void dispose() {
    _termoController.dispose();
    _sheetController.dispose();
    super.dispose();
  }

  Future<void> _carregar() async {
    final resultado = await ApiClient.pontos();
    if (!mounted) return;
    final validos = (resultado.data ?? const <PontoColeta>[])
        .where(
          (ponto) =>
              ponto.latitude.isFinite &&
              ponto.longitude.isFinite &&
              !(ponto.latitude == 0 && ponto.longitude == 0),
        )
        .toList();
    setState(() {
      _pontos = validos;
      _carregando = false;
    });
  }

  List<String> get _materiais {
    final unicos = <String>{};
    for (final ponto in _pontos) {
      unicos.addAll(materiaisDoPonto(ponto));
    }
    final lista = unicos.toList()
      ..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
    return lista;
  }

  List<PontoColeta> get _pontosFiltrados {
    return _pontos
        .where(
          (ponto) =>
              _material.isEmpty || materiaisDoPonto(ponto).contains(_material),
        )
        .where((ponto) => !_somenteAbertos || abertoAgora(ponto.funcionamento))
        .where((ponto) => _distancia(ponto) <= _raio)
        .toList()
      ..sort((a, b) => _distancia(a).compareTo(_distancia(b)));
  }

  double _distancia(PontoColeta ponto) => distanceKm(
    _centro.latitude,
    _centro.longitude,
    ponto.latitude,
    ponto.longitude,
  );

  void _centralizar(LatLng centro) {
    setState(() => _centro = centro);
    _mapController.move(centro, 14);
  }

  Future<LatLng?> _geocodificar(String termo) async {
    final uri = Uri.https('nominatim.openstreetmap.org', '/search', {
      'q': termo.trim(),
      'format': 'jsonv2',
      'addressdetails': '1',
      'limit': '1',
      'countrycodes': 'br',
      'accept-language': 'pt-BR',
    });
    try {
      final resposta = await http
          .get(uri, headers: {'Accept': 'application/json'})
          .timeout(const Duration(seconds: 20));
      if (resposta.statusCode != 200) return null;
      final decodificado = jsonDecode(resposta.body);
      if (decodificado is! List || decodificado.isEmpty) return null;
      final primeiro = asMap(decodificado.first);
      final latitude = double.tryParse(str(primeiro['lat']) ?? '');
      final longitude = double.tryParse(str(primeiro['lon']) ?? '');
      if (latitude == null || longitude == null) return null;
      return LatLng(latitude, longitude);
    } catch (_) {
      return null;
    }
  }

  Future<void> _buscar() async {
    final termo = _termoController.text.trim();
    if (termo.isEmpty) return;
    setState(() {
      _buscando = true;
      _mensagem = '';
    });

    try {
      LatLng? localizacao;
      if (Masks.digits(termo, 8).length == 8) {
        final resultado = await ApiClient.cep(Masks.cep(termo));
        final dados = resultado.data;
        if (resultado.ok &&
            dados != null &&
            dados.latitude != null &&
            dados.longitude != null) {
          localizacao = LatLng(dados.latitude!, dados.longitude!);
        }
      }
      localizacao ??= await _geocodificar(termo);
      if (!mounted) return;

      if (localizacao == null) {
        setState(
          () => _mensagem =
              'Não encontramos essa rua ou bairro. Tente outro termo.',
        );
        return;
      }

      _centralizar(localizacao);
      final perto = await ApiClient.pontosProximos(
        localizacao.latitude,
        localizacao.longitude,
        raio: 5,
      );
      if (!mounted) return;

      if (perto.ok && (perto.data?.isNotEmpty ?? false)) {
        setState(() {
          _raio = 5;
          _mensagem =
              '${perto.data!.length} ponto(s) encontrado(s) em até 5 km.';
        });
        return;
      }

      final longe = await ApiClient.pontosProximos(
        localizacao.latitude,
        localizacao.longitude,
        raio: 40,
      );
      if (!mounted) return;
      final quantidade = longe.data?.length ?? 0;
      setState(() {
        _raio = 40;
        _mensagem = quantidade > 0
            ? 'Nenhum ponto em 5 km. Encontramos $quantidade em até 40 km.'
            : 'Nenhum ponto de coleta encontrado em até 40 km.';
      });
    } catch (_) {
      if (!mounted) return;
      setState(
        () => _mensagem = 'Não foi possível buscar agora. Tente novamente.',
      );
    } finally {
      if (mounted) setState(() => _buscando = false);
    }
  }

  void _alternarExpanded() {
    setState(() => _expanded = !_expanded);
    if (_sheetController.isAttached) {
      _sheetController.animateTo(
        _expanded ? 0.88 : 0.48,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeInOut,
      );
    }
  }

  void _abrirPonto(PontoColeta ponto) {
    _centralizar(LatLng(ponto.latitude, ponto.longitude));
    go(context, '/confirmacao-agendamento', {'ponto': ponto.id.toString()});
  }

  void _mostrarMarcador(PontoColeta ponto) {
    final parentContext = context;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(Solus.radius)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                ponto.nome ?? 'Ponto de coleta',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                ponto.endereco ??
                    '${ponto.latitude.toStringAsFixed(4)}, ${ponto.longitude.toStringAsFixed(4)}',
                style: const TextStyle(fontSize: 12, color: Solus.muted),
              ),
              const SizedBox(height: 16),
              LinkAction('Ver detalhes da empresa', () {
                Navigator.of(context).pop();
                go(parentContext, '/detalhes-ponto', {
                  'ponto': ponto.id.toString(),
                });
              }),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pontosFiltrados = _pontosFiltrados;
    final alturaMapa = (MediaQuery.of(context).size.height * 0.42).clamp(
      260.0,
      420.0,
    );

    return AppScaffold(
      currentPath: '/mapa',
      child: Column(
        children: [
          SizedBox(
            height: alturaMapa,
            child: Stack(
              children: [
                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: _centroPadrao,
                    initialZoom: 13,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate:
                          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.solus.recycle.app',
                    ),
                    CircleLayer(
                      circles: [
                        CircleMarker(
                          point: _centro,
                          radius: _raio * 1000,
                          useRadiusInMeter: true,
                          color: Solus.green.withValues(alpha: .08),
                          borderColor: Solus.green.withValues(alpha: .40),
                          borderStrokeWidth: 1,
                        ),
                      ],
                    ),
                    MarkerLayer(
                      markers: [
                        for (final ponto in pontosFiltrados)
                          Marker(
                            point: LatLng(ponto.latitude, ponto.longitude),
                            width: 36,
                            height: 44,
                            alignment: Alignment.topCenter,
                            child: GestureDetector(
                              onTap: () => _mostrarMarcador(ponto),
                              child: SizedBox(
                                width: 36,
                                height: 44,
                                child: Stack(
                                  alignment: Alignment.topCenter,
                                  children: [
                                    Icon(
                                      LucideIcons.mapPin,
                                      size: 36,
                                      color: Solus.green,
                                      shadows: const [
                                        Shadow(
                                          color: Color(0x55000000),
                                          blurRadius: 6,
                                          offset: Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    const Positioned(
                                      top: 10,
                                      child: IgnorePointer(
                                        child: SizedBox(
                                          width: 8,
                                          height: 8,
                                          child: DecoratedBox(
                                            decoration: BoxDecoration(
                                              color: Colors.white,
                                              shape: BoxShape.circle,
                                            ),
                                          ),
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
                    const SimpleAttributionWidget(
                      source: Text('OpenStreetMap'),
                    ),
                  ],
                ),
                Positioned(
                  top: 10,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Solus.surface.withValues(alpha: .94),
                        borderRadius: BorderRadius.circular(999),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x11111827),
                            blurRadius: 10,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Text(
                        _carregando
                            ? 'Carregando...'
                            : '${pontosFiltrados.length} ponto(s) no mapa',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ),
                Positioned(
                  left: 12,
                  bottom: 24,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 11,
                      vertical: 7,
                    ),
                    decoration: BoxDecoration(
                      color: Solus.surface,
                      border: Border.all(color: Solus.border),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      'Raio de $_raio km',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: DraggableScrollableSheet(
              controller: _sheetController,
              expand: true,
              initialChildSize: 0.48,
              minChildSize: 0.48,
              maxChildSize: 0.88,
              builder: (context, scrollController) => Container(
                decoration: const BoxDecoration(
                  color: Solus.surface,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x0A111827),
                      blurRadius: 12,
                      offset: Offset(0, -2),
                    ),
                  ],
                ),
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                  children: [
                    GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: _alternarExpanded,
                      child: Column(
                        children: [
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 10),
                            child: SizedBox(
                              width: 46,
                              height: 5,
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                  color: Color(0xFFD5D5D5),
                                  borderRadius: BorderRadius.all(
                                    Radius.circular(999),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Icon(
                            _expanded
                                ? LucideIcons.chevronDown
                                : LucideIcons.chevronUp,
                            size: 18,
                            color: Solus.green,
                          ),
                          const SizedBox(height: 5),
                          Text(
                            _expanded
                                ? 'Ver apenas nomes'
                                : 'Ver detalhes dos pontos',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Solus.muted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Encontre pontos de coleta\ne organizações perto de você',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _termoController,
                            decoration: const InputDecoration(
                              hintText: 'Rua ou bairro',
                            ),
                            onSubmitted: (_) => _buscar(),
                          ),
                        ),
                        const SizedBox(width: 10),
                        SizedBox(
                          height: 49,
                          child: ElevatedButton(
                            onPressed: _buscando ? null : _buscar,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Solus.greenSoft,
                              foregroundColor: Solus.greenDark,
                              minimumSize: const Size(52, 49),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(
                                  Solus.radius,
                                ),
                              ),
                            ),
                            child: _buscando
                                ? const SizedBox(
                                    height: 19,
                                    width: 19,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Solus.greenDark,
                                    ),
                                  )
                                : const Icon(LucideIcons.search, size: 19),
                          ),
                        ),
                      ],
                    ),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: TextButton.icon(
                        onPressed: () =>
                            setState(() => _filtrosAbertos = !_filtrosAbertos),
                        icon: const Icon(
                          LucideIcons.slidersHorizontal,
                          size: 16,
                        ),
                        label: const Text('Filtros'),
                        style: TextButton.styleFrom(
                          foregroundColor: Solus.greenDark,
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          textStyle: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    if (_filtrosAbertos)
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Solus.greenSoft,
                          borderRadius: BorderRadius.circular(Solus.radius),
                        ),
                        child: Column(
                          children: [
                            DropdownButtonFormField<String>(
                              initialValue: _material,
                              decoration: const InputDecoration(
                                labelText: 'Material',
                                filled: true,
                                fillColor: Solus.surface,
                              ),
                              items: [
                                const DropdownMenuItem(
                                  value: '',
                                  child: Text('Todos'),
                                ),
                                ..._materiais.map(
                                  (item) => DropdownMenuItem(
                                    value: item,
                                    child: Text(item),
                                  ),
                                ),
                              ],
                              onChanged: (valor) =>
                                  setState(() => _material = valor ?? ''),
                            ),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<int>(
                              initialValue: _raio,
                              decoration: const InputDecoration(
                                labelText: 'Distância',
                                filled: true,
                                fillColor: Solus.surface,
                              ),
                              items: [
                                for (final raio in _raios)
                                  DropdownMenuItem(
                                    value: raio,
                                    child: Text('Até $raio km'),
                                  ),
                              ],
                              onChanged: (valor) =>
                                  setState(() => _raio = valor ?? 40),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(
                                  LucideIcons.clock3,
                                  size: 15,
                                  color: Solus.muted,
                                ),
                                const SizedBox(width: 6),
                                const Expanded(
                                  child: Text(
                                    'Aberto neste horário',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                Switch(
                                  value: _somenteAbertos,
                                  activeThumbColor: Solus.green,
                                  activeTrackColor: Solus.green.withValues(
                                    alpha: .4,
                                  ),
                                  onChanged: (valor) =>
                                      setState(() => _somenteAbertos = valor),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    if (_mensagem.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 10, bottom: 4),
                        child: Text(
                          _mensagem,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 12,
                            color: Solus.greenDark,
                          ),
                        ),
                      ),
                    const SizedBox(height: 6),
                    if (_carregando)
                      const Padding(
                        padding: EdgeInsets.all(20),
                        child: LoadingView(label: 'Carregando...'),
                      )
                    else if (pontosFiltrados.isEmpty)
                      EmptyState(
                        'Nenhum ponto encontrado com esses filtros.',
                        icon: LucideIcons.mapPin,
                        compact: true,
                      )
                    else
                      ...pontosFiltrados.map(
                        (ponto) => _PontoListTile(
                          ponto: ponto,
                          distancia: _distancia(ponto),
                          expanded: _expanded,
                          onTap: () => _abrirPonto(ponto),
                          onDetails: () => go(context, '/detalhes-ponto', {
                            'ponto': ponto.id.toString(),
                          }),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PontoListTile extends StatelessWidget {
  final PontoColeta ponto;
  final double distancia;
  final bool expanded;
  final VoidCallback onTap;
  final VoidCallback onDetails;

  const _PontoListTile({
    required this.ponto,
    required this.distancia,
    required this.expanded,
    required this.onTap,
    required this.onDetails,
  });

  @override
  Widget build(BuildContext context) {
    final distanciaLabel =
        '${distancia.toStringAsFixed(1).replaceAll('.', ',')} km de você';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(Solus.radius),
          color: Solus.surface,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            InkWell(
              onTap: onTap,
              borderRadius: BorderRadius.circular(Solus.radius),
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(top: 2),
                      child: Icon(
                        LucideIcons.mapPin,
                        size: 20,
                        color: Solus.green,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            ponto.nome ?? 'Ponto de coleta',
                            style: TextStyle(
                              fontSize: expanded ? 15 : 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            distanciaLabel,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Solus.greenDark,
                            ),
                          ),
                          if (expanded) ...[
                            const SizedBox(height: 4),
                            Text(
                              ponto.endereco ?? 'Endereço não informado',
                              style: const TextStyle(
                                fontSize: 13,
                                color: Solus.muted,
                              ),
                            ),
                            if (ponto.complemento != null &&
                                ponto.complemento!.isNotEmpty)
                              Text(
                                ponto.complemento!,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: Solus.muted,
                                ),
                              ),
                            if (ponto.companyNome != null &&
                                ponto.companyNome!.isNotEmpty)
                              Text(
                                ponto.companyNome!,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: Solus.greenDark,
                                ),
                              ),
                            if (ponto.tipoResiduo != null &&
                                ponto.tipoResiduo!.isNotEmpty)
                              Text(
                                'Aceita: ${ponto.tipoResiduo}',
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: Solus.greenDark,
                                ),
                              ),
                            Text(
                              rotuloFuncionamento(ponto.funcionamento),
                              style: const TextStyle(
                                fontSize: 13,
                                color: Solus.greenDark,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (expanded)
              Padding(
                padding: const EdgeInsets.fromLTRB(40, 0, 8, 8),
                child: LinkAction('Ver detalhes da empresa', onDetails),
              ),
          ],
        ),
      ),
    );
  }
}
