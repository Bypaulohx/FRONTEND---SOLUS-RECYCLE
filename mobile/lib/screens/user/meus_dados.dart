import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../../models.dart';
import '../../providers/session.dart';
import '../../services/api.dart';
import '../../theme.dart';
import '../../utils/format.dart';
import '../../widgets/ui.dart';

class MeusDadosScreen extends StatefulWidget {
  const MeusDadosScreen({super.key});

  @override
  State<MeusDadosScreen> createState() => _MeusDadosScreenState();
}

class _MeusDadosScreenState extends State<MeusDadosScreen> {
  static const List<String> _diasSemana = [
    'Seg',
    'Ter',
    'Qua',
    'Qui',
    'Sex',
    'Sáb',
    'Dom',
  ];

  String? _editando;
  String _telefone = '';
  String _cep = '';
  String _rua = '';
  String _numero = '';
  String _complemento = '';
  String _bairro = '';
  String _cidade = '';
  String _estado = '';
  String _mensagem = '';
  String _erro = '';

  String _nomeFantasia = '';
  String _razaoSocial = '';
  String _descricao = '';
  String _telefoneEmpresa = '';
  String _materiais = '';
  String _pesoMinimo = '';
  String _pesoMaximo = '';
  List<String> _dias = const [];
  List<Feriado> _feriados = const [];
  String? _imagemLocal;
  String _uf = 'SP';
  String _municipio = 'São Paulo';
  bool _carregandoFeriados = false;
  bool _salvando = false;

  Me? _ultimoMe;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final me = Provider.of<Session>(context).me;
    if (!identical(me, _ultimoMe)) {
      _ultimoMe = me;
      _sincronizar(me);
    }
  }

  void _sincronizar(Me? me) {
    final endereco = me?.endereco;
    setState(() {
      _telefone = Masks.phone(me?.telefone ?? '');
      _cep = endereco?.cep ?? '';
      _rua = endereco?.rua ?? '';
      _numero = endereco?.numero ?? '';
      _complemento = endereco?.complemento ?? '';
      _bairro = endereco?.bairro ?? '';
      _cidade = endereco?.cidade ?? '';
      _estado = endereco?.estado ?? '';

      _nomeFantasia = me?.nomeFantasia ?? '';
      _razaoSocial = me?.razaoSocial ?? '';
      _descricao = me?.descricao ?? '';
      _telefoneEmpresa = Masks.phone(me?.telefone ?? '');
      _materiais = stringList(me?.materiaisColeta).join(', ');
      _pesoMinimo = me?.pesoMinimoKg != null ? '${me!.pesoMinimoKg}' : '';
      _pesoMaximo = me?.pesoMaximoKg != null ? '${me!.pesoMaximoKg}' : '';
      _dias = stringList(me?.diasFuncionamento);
      _feriados = _feriadosSalvos(me?.feriados);
      _imagemLocal = me?.imagemLocal;
      _uf = endereco?.estado ?? 'SP';
      _municipio = endereco?.cidade ?? 'São Paulo';
    });
  }

  List<Feriado> _feriadosSalvos(String? valor) {
    if (valor == null || valor.isEmpty) return const [];
    try {
      final decoded = jsonDecode(valor);
      if (decoded is! List) return const [];
      return decoded.map((item) {
        final j = asMap(item);
        return Feriado(
          data: str(j['data']) ?? '',
          motivo: str(j['motivo']) ?? 'Feriado',
          tipo: str(j['tipo']) ?? 'municipal',
        );
      }).toList();
    } catch (_) {
      return const [];
    }
  }

  Future<void> _salvarTelefone(Session session) async {
    setState(() => _erro = '');
    final result = await ApiClient.updatePhone(Masks.digits(_telefone, 11));
    if (!mounted) return;
    if (result.error != null) {
      setState(() => _erro = result.error!);
      return;
    }
    await session.refreshUser();
    if (!mounted) return;
    setState(() {
      _mensagem = 'Telefone atualizado com sucesso.';
      _editando = null;
    });
  }

  Future<void> _salvarEndereco(Session session) async {
    setState(() => _erro = '');
    final atual = session.me?.endereco;
    final endereco = Endereco(
      cep: Masks.digits(_cep, 8),
      rua: _rua,
      numero: _numero,
      complemento: _complemento,
      bairro: _bairro,
      cidade: _cidade,
      estado: _estado.toUpperCase(),
      latitude: atual?.latitude,
      longitude: atual?.longitude,
    );
    final result = await ApiClient.updateAddress(endereco);
    if (!mounted) return;
    if (result.error != null) {
      setState(() => _erro = result.error!);
      return;
    }
    await session.refreshUser();
    if (!mounted) return;
    setState(() {
      _mensagem = 'Endereço atualizado com sucesso.';
      _editando = null;
    });
  }

  Future<void> _buscarFeriados() async {
    setState(() {
      _carregandoFeriados = true;
      _erro = '';
      _mensagem = '';
    });

    final ano = DateTime.now().year;
    final encontrados = await _buscarNaBrasilApi(ano, _uf, _municipio);
    if (!mounted) return;
    setState(() {
      final mapa = <String, Feriado>{for (final f in _feriados) f.data: f};
      for (final feriado in encontrados) {
        mapa[feriado.data] = feriado;
      }
      _feriados = mapa.values.toList()
        ..sort((a, b) => a.data.compareTo(b.data));
      _mensagem = '${encontrados.length} feriados encontrados na BrasilAPI.';
      _carregandoFeriados = false;
    });
  }

  Future<List<Feriado>> _buscarNaBrasilApi(
    int ano,
    String uf,
    String municipio,
  ) async {
    final resultados = <Feriado>[];

    Future<void> consultar(String url, String tipo) async {
      try {
        final resposta = await http
            .get(Uri.parse(url), headers: {'Accept': 'application/json'})
            .timeout(const Duration(seconds: 15));
        if (resposta.statusCode < 200 || resposta.statusCode >= 300) return;
        final decoded = jsonDecode(resposta.body);
        if (decoded is! List) return;
        for (final item in decoded) {
          final j = asMap(item);
          final data = str(j['date']);
          final motivo = str(j['name']) ?? str(j['nome']);
          if (data != null &&
              data.isNotEmpty &&
              motivo != null &&
              motivo.isNotEmpty) {
            if (!resultados.any((f) => f.data == data)) {
              resultados.add(Feriado(data: data, motivo: motivo, tipo: tipo));
            }
          }
        }
      } catch (_) {
        // API indisponível: mantém apenas os feriados já carregados.
      }
    }

    await consultar(
      'https://brasilapi.com.br/api/feriados/v1/$ano',
      'nacional',
    );
    final query = <String, String>{
      if (uf.isNotEmpty) 'uf': uf,
      if (municipio.isNotEmpty) 'municipio': municipio,
    };
    final params = query.entries
        .map(
          (e) =>
              '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}',
        )
        .join('&');
    await consultar(
      'https://brasilapi.com.br/api/feriados/v1/$ano${params.isNotEmpty ? '?$params' : ''}',
      'estadual',
    );

    if (resultados.isEmpty) {
      final fallback = await ApiClient.feriados(
        ano: ano,
        uf: uf,
        municipio: municipio,
      );
      if (fallback.ok && fallback.data != null) {
        for (final feriado in fallback.data!) {
          if (!resultados.any((f) => f.data == feriado.data)) {
            resultados.add(feriado);
          }
        }
      }
    }
    resultados.sort((a, b) => a.data.compareTo(b.data));
    return resultados;
  }

  Future<void> _selecionarImagem() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery);
    if (image == null) return;
    final bytes = await image.readAsBytes();
    if (bytes.lengthInBytes > 2 * 1024 * 1024) {
      setState(() => _erro = 'A imagem deve ter no máximo 2 MB.');
      return;
    }
    final mime = image.mimeType ?? 'image/jpeg';
    final dataUrl = 'data:$mime;base64,${base64Encode(bytes)}';
    if (!mounted) return;
    setState(() {
      _imagemLocal = dataUrl;
      _erro = '';
    });
  }

  Uint8List? _imagemBytes() {
    if (_imagemLocal == null || !_imagemLocal!.contains(',')) return null;
    try {
      return base64Decode(_imagemLocal!.split(',').last);
    } catch (_) {
      return null;
    }
  }

  Future<void> _salvarEmpresa(Session session) async {
    setState(() {
      _salvando = true;
      _erro = '';
      _mensagem = '';
    });
    final body = <String, dynamic>{
      'nomeFantasia': _nomeFantasia,
      'razaoSocial': _razaoSocial,
      'descricao': _descricao,
      'telefone': Masks.digits(_telefoneEmpresa, 11),
      'materiaisColeta': _materiais
          .split(',')
          .map((item) => item.trim())
          .where((item) => item.isNotEmpty)
          .toList(),
      'pesoMinimoKg': double.tryParse(_pesoMinimo.replaceFirst(',', '.')),
      'pesoMaximoKg': double.tryParse(_pesoMaximo.replaceFirst(',', '.')),
      'diasFuncionamento': _dias,
      'feriados': _feriados.map((f) => f.toJson()).toList(),
      'imagemLocal': _imagemLocal,
    };
    final result = await ApiClient.updateCompany(body);
    if (!mounted) return;
    setState(() => _salvando = false);
    if (result.error != null) {
      setState(() => _erro = result.error!);
      return;
    }
    await session.refreshUser();
    if (!mounted) return;
    setState(() => _mensagem = 'Dados da organização salvos.');
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();
    final me = session.me;
    final endereco = me?.endereco;

    return AppScaffold(
      currentPath: '/meus-dados',
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SolusBackButton(),
            const SizedBox(height: 12),
            const Text(
              'Meus dados',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            if (_mensagem.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  _mensagem,
                  style: const TextStyle(fontSize: 13, color: Solus.greenDark),
                ),
              ),
            if (_erro.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  _erro,
                  style: const TextStyle(fontSize: 13, color: Solus.danger),
                ),
              ),
            _dataItem(label: 'Nome', child: _dataCard(me?.nome ?? '-')),
            _dataItem(label: 'E-mail', child: _dataCard(me?.email ?? '-')),
            _dataItem(
              label: 'Telefone',
              child: _editando == 'telefone'
                  ? Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: TextEditingController(text: _telefone),
                            keyboardType: TextInputType.phone,
                            onChanged: (value) =>
                                _telefone = Masks.phone(value),
                            decoration: const InputDecoration(
                              hintText: '(00) 00000-0000',
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        MiniButton(
                          'Salvar',
                          icon: LucideIcons.check,
                          onPressed: () => _salvarTelefone(session),
                        ),
                      ],
                    )
                  : _dataCard(
                      Masks.phone(me?.telefone ?? '').isEmpty
                          ? '-'
                          : Masks.phone(me?.telefone ?? ''),
                      trailing: IconButton(
                        onPressed: () => setState(() => _editando = 'telefone'),
                        icon: const Icon(
                          LucideIcons.pencil,
                          size: 16,
                          color: Solus.greenDark,
                        ),
                        tooltip: 'Editar telefone',
                      ),
                    ),
            ),
            _dataItem(
              label: 'Endereço',
              child: _editando == 'endereco'
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _field(
                          'CEP',
                          _cep,
                          (v) => _cep = Masks.cep(v),
                          hint: '00000-000',
                        ),
                        const SizedBox(height: 10),
                        _field('Rua', _rua, (v) => _rua = v),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: _field(
                                'Número',
                                _numero,
                                (v) => _numero = v,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: _field(
                                'Complemento',
                                _complemento,
                                (v) => _complemento = v,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        _field('Bairro', _bairro, (v) => _bairro = v),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: _field(
                                'Cidade',
                                _cidade,
                                (v) => _cidade = v,
                              ),
                            ),
                            const SizedBox(width: 8),
                            SizedBox(
                              width: 70,
                              child: _field(
                                'UF',
                                _estado,
                                (v) => _estado = v.toUpperCase().substring(
                                  0,
                                  v.length > 2 ? 2 : v.length,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: MiniButton(
                            'Salvar endereço',
                            icon: LucideIcons.check,
                            onPressed: () => _salvarEndereco(session),
                          ),
                        ),
                      ],
                    )
                  : Stack(
                      children: [
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.fromLTRB(12, 12, 44, 12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF9F9F9),
                            borderRadius: BorderRadius.circular(Solus.radius),
                            border: Border.all(color: Solus.border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _addressLine('CEP', endereco?.cep ?? '-'),
                              _addressLine(
                                'Rua',
                                '${endereco?.rua ?? '-'}, ${endereco?.numero ?? '-'}',
                              ),
                              _addressLine(
                                'Complemento',
                                endereco?.complemento?.isNotEmpty == true
                                    ? endereco!.complemento!
                                    : 'Não informado',
                              ),
                              _addressLine('Bairro', endereco?.bairro ?? '-'),
                              _addressLine(
                                'Cidade/UF',
                                '${endereco?.cidade ?? '-'}/${endereco?.estado ?? '-'}',
                              ),
                            ],
                          ),
                        ),
                        Positioned(
                          top: 6,
                          right: 6,
                          child: IconButton(
                            onPressed: () =>
                                setState(() => _editando = 'endereco'),
                            icon: const Icon(
                              LucideIcons.pencil,
                              size: 16,
                              color: Solus.greenDark,
                            ),
                            tooltip: 'Editar endereço',
                          ),
                        ),
                      ],
                    ),
            ),
            if (session.isCompany) _empresaForm(),
          ],
        ),
      ),
    );
  }

  Widget _empresaForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionTitle('Dados da organização'),
        _field('Nome fantasia', _nomeFantasia, (v) => _nomeFantasia = v),
        const SizedBox(height: 10),
        _field('Razão social', _razaoSocial, (v) => _razaoSocial = v),
        const SizedBox(height: 10),
        _field('Descrição', _descricao, (v) => _descricao = v),
        const SizedBox(height: 10),
        _field(
          'Telefone',
          _telefoneEmpresa,
          (v) => _telefoneEmpresa = Masks.phone(v),
          keyboardType: TextInputType.phone,
        ),
        const SectionTitle('Operação'),
        _field(
          'Materiais aceitos',
          _materiais,
          (v) => _materiais = v,
          hint: 'Papel, Plástico, Vidro',
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _field(
                'Peso mín. (kg)',
                _pesoMinimo,
                (v) => _pesoMinimo = v,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _field(
                'Peso máx. (kg)',
                _pesoMaximo,
                (v) => _pesoMaximo = v,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: _diasSemana.map((dia) {
            final ativo = _dias.contains(dia);
            return InkWell(
              onTap: () => setState(() {
                _dias = ativo
                    ? _dias.where((d) => d != dia).toList()
                    : [..._dias, dia];
              }),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: ativo ? Solus.greenSoft : Solus.surface,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: ativo ? Solus.green : Solus.border),
                ),
                child: Text(
                  dia,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: ativo ? Solus.greenDark : Solus.muted,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SectionTitle('Feriados'),
        Row(
          children: [
            Expanded(
              child: _field(
                'UF',
                _uf,
                (v) => _uf = v.toUpperCase().substring(
                  0,
                  v.length > 2 ? 2 : v.length,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _field('Município', _municipio, (v) => _municipio = v),
            ),
          ],
        ),
        const SizedBox(height: 10),
        SolusButton(
          _carregandoFeriados ? 'Buscando...' : 'Buscar feriados na BrasilAPI',
          outlined: true,
          icon: LucideIcons.calendarDays,
          onPressed: _carregandoFeriados ? null : _buscarFeriados,
        ),
        const SizedBox(height: 10),
        ..._feriados.map(
          (feriado) => Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Solus.surface,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Solus.border),
              ),
              child: Row(
                children: [
                  SizedBox(
                    width: 72,
                    child: Text(
                      feriado.data.split('-').reversed.join('/'),
                      style: const TextStyle(fontSize: 10),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      feriado.motivo ?? '',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  Text(
                    feriado.tipo ?? '',
                    style: const TextStyle(fontSize: 10, color: Solus.muted),
                  ),
                  IconButton(
                    onPressed: () => setState(
                      () => _feriados = _feriados
                          .where((f) => f != feriado)
                          .toList(),
                    ),
                    icon: const Icon(
                      LucideIcons.trash2,
                      size: 15,
                      color: Solus.danger,
                    ),
                    tooltip: 'Remover ${feriado.motivo}',
                  ),
                ],
              ),
            ),
          ),
        ),
        Align(
          alignment: Alignment.centerLeft,
          child: LinkAction(
            '+ Adicionar feriado manual',
            () => setState(() {
              _feriados = [
                ..._feriados,
                Feriado(
                  data: DateTime.now().toIso8601String().substring(0, 10),
                  motivo: 'Novo feriado',
                  tipo: 'municipal',
                ),
              ];
            }),
            icon: LucideIcons.plus,
          ),
        ),
        const SectionTitle('Imagem do local'),
        InkWell(
          onTap: _selecionarImagem,
          child: Container(
            width: double.infinity,
            height: 120,
            margin: const EdgeInsets.symmetric(vertical: 4),
            decoration: BoxDecoration(
              color: Solus.surface,
              borderRadius: BorderRadius.circular(Solus.radius),
              border: Border.all(color: Solus.inactive),
            ),
            clipBehavior: Clip.antiAlias,
            child: _imagemBytes() != null
                ? Image.memory(
                    _imagemBytes()!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => _uploadPlaceholder(),
                  )
                : _uploadPlaceholder(),
          ),
        ),
        const SizedBox(height: 20),
        SolusButton(
          _salvando ? 'Salvando…' : 'Salvar dados da organização',
          onPressed: _salvando
              ? null
              : () => _salvarEmpresa(context.read<Session>()),
        ),
      ],
    );
  }

  Widget _uploadPlaceholder() => const Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      Icon(LucideIcons.imagePlus, size: 22, color: Solus.muted),
      SizedBox(height: 6),
      Text(
        'Enviar foto do local',
        style: TextStyle(fontSize: 11, color: Solus.muted),
      ),
    ],
  );

  Widget _dataItem({required String label, required Widget child}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: Solus.muted)),
          const SizedBox(height: 6),
          child,
        ],
      ),
    );
  }

  Widget _dataCard(String value, {Widget? trailing}) {
    final trailingWidget = trailing;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF9F9F9),
        borderRadius: BorderRadius.circular(Solus.radius),
        border: Border.all(color: Solus.border),
      ),
      child: Row(
        children: [
          Expanded(child: Text(value, style: const TextStyle(fontSize: 14))),
          ?trailingWidget,
        ],
      ),
    );
  }

  Widget _addressLine(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: Solus.muted)),
          const SizedBox(width: 10),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Widget _field(
    String label,
    String value,
    ValueChanged<String> onChanged, {
    String? hint,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: Solus.muted,
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: TextEditingController(text: value),
          onChanged: onChanged,
          keyboardType: keyboardType,
          decoration: InputDecoration(hintText: hint),
        ),
      ],
    );
  }
}
