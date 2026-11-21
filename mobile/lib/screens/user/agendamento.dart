import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../app.dart';
import '../../models.dart';
import '../../theme.dart';
import '../../services/api.dart';
import '../../widgets/ui.dart';

/// Equivalente ao `location.state` do React: mantém o agendamento recém-criado
/// disponível para a tela de confirmação até que a API seja consultada.
Agendamento? ultimoAgendamentoCriado;

class AgendamentoScreen extends StatefulWidget {
  const AgendamentoScreen({super.key});

  @override
  State<AgendamentoScreen> createState() => _AgendamentoScreenState();
}

class _AgendamentoScreenState extends State<AgendamentoScreen> {
  static const _monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  static const _weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  static const _weights = ['10', '20', '30', '40', '50'];
  static const _times = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '14:00',
    '14:30',
    '15:00',
    '16:00',
  ];

  final _observacaoController = TextEditingController();
  final _hoje = DateTime.now();

  late int _currentMonth;
  late int _currentYear;
  DateTime? _selectedDay;
  String _selectedTime = '14:30';
  String _material = 'Metal';
  String _peso = '10';
  bool _useDefaultAddress = true;
  Empresa? _empresa;
  PontoColeta? _ponto;
  String _error = '';
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _currentMonth = _hoje.month;
    _currentYear = _hoje.year;
    _carregar();
  }

  @override
  void dispose() {
    _observacaoController.dispose();
    super.dispose();
  }

  Future<void> _carregar() async {
    final params = paramsOf(context);
    final empresaParam = int.tryParse(params['empresa'] ?? '') ?? 0;
    final pontoParam = int.tryParse(params['ponto'] ?? '') ?? 0;

    final resultados = await Future.wait([
      ApiClient.empresas(),
      pontoParam != 0
          ? ApiClient.pontos()
          : Future.value(ApiResult<List<PontoColeta>>(status: 0)),
    ]);
    if (!mounted) return;

    final empresas =
        (resultados[0] as ApiResult<List<Empresa>>).data ?? const [];
    final pontos =
        (resultados[1] as ApiResult<List<PontoColeta>>).data ?? const [];
    final ponto = pontoParam == 0
        ? null
        : pontos.cast<PontoColeta?>().firstWhere(
            (item) => item?.id == pontoParam,
            orElse: () => null,
          );
    final empresaId = ponto?.companyId ?? empresaParam;
    final empresa =
        empresas.cast<Empresa?>().firstWhere(
          (item) => item?.id == empresaId,
          orElse: () => null,
        ) ??
        (empresas.isEmpty ? null : empresas.first);

    setState(() {
      _empresa = empresa;
      _ponto = ponto;
      final tipoResiduo = ponto?.tipoResiduo;
      if (tipoResiduo != null && tipoResiduo.isNotEmpty) {
        _material = tipoResiduo.split(RegExp(r'[,;]')).first.trim();
        if (_material.isEmpty) _material = 'Metal';
      }
      final pesoMinimo = ponto?.pesoMinimoKg;
      if (pesoMinimo != null) {
        _peso = _pesoLabel(pesoMinimo);
      }
    });
  }

  String _pesoLabel(double valor) {
    if (valor == 10 ||
        valor == 20 ||
        valor == 30 ||
        valor == 40 ||
        valor == 50) {
      return valor.round().toString();
    }
    if (valor < 10) return '10';
    return valor.round().toString();
  }

  List<DateTime?> get _dias {
    final primeiro = DateTime(_currentYear, _currentMonth, 1);
    final total = DateTime(_currentYear, _currentMonth + 1, 0).day;
    final dias = <DateTime?>[
      for (var i = 0; i < primeiro.weekday % 7; i++) null,
      for (var dia = 1; dia <= total; dia++)
        DateTime(_currentYear, _currentMonth, dia),
    ];
    return dias;
  }

  bool _passado(DateTime dia) =>
      dia.isBefore(DateTime(_hoje.year, _hoje.month, _hoje.day));

  void _mudarMes(int delta) {
    setState(() {
      var mes = _currentMonth + delta;
      var ano = _currentYear;
      if (mes < 1) {
        mes = 12;
        ano--;
      } else if (mes > 12) {
        mes = 1;
        ano++;
      }
      _currentMonth = mes;
      _currentYear = ano;
      _selectedDay = null;
    });
  }

  Future<void> _enviar() async {
    setState(() => _error = '');
    if (_selectedDay == null) {
      setState(() => _error = 'Selecione uma data para a coleta.');
      return;
    }
    final empresa = _empresa;
    if (empresa == null) {
      setState(
        () => _error = 'Nenhuma empresa de coleta disponível no momento.',
      );
      return;
    }

    final dd = _selectedDay!.day.toString().padLeft(2, '0');
    final mm = _currentMonth.toString().padLeft(2, '0');
    final scheduleTime = '$dd/$mm/$_currentYear $_selectedTime';

    setState(() => _loading = true);
    final resultado = await ApiClient.criarAgendamento(
      companyId: empresa.id,
      tipoResiduo: _material,
      pesoEstimado: double.parse(_peso),
      scheduleTime: scheduleTime,
    );
    if (!mounted) return;
    setState(() => _loading = false);

    if (resultado.error != null || resultado.data == null) {
      setState(() => _error = resultado.error ?? 'Não foi possível agendar.');
      return;
    }
    ultimoAgendamentoCriado = resultado.data;
    go(context, '/confirmacao-agendamento', {
      'id': resultado.data!.id.toString(),
    });
  }

  Widget _label(String texto, {String? helper}) => Padding(
    padding: const EdgeInsets.only(top: 16, bottom: 8),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          texto,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
        if (helper != null)
          Padding(
            padding: const EdgeInsets.only(top: 3),
            child: Text(
              helper,
              style: const TextStyle(fontSize: 12, color: Solus.muted),
            ),
          ),
      ],
    ),
  );

  @override
  Widget build(BuildContext context) {
    final titulo =
        _ponto?.nome ??
        _empresa?.nomeFantasia ??
        _empresa?.razaoSocial ??
        'Ponto de coleta';
    final subtitulo =
        _empresa?.nomeFantasia ?? _empresa?.razaoSocial ?? _ponto?.endereco;

    return AppScaffold(
      currentPath: '/agendamento',
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: Solus.cardDecoration(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  titulo,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    height: 1.35,
                  ),
                ),
                if (subtitulo != null && subtitulo.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      subtitulo,
                      style: const TextStyle(fontSize: 12, color: Solus.muted),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: Solus.cardDecoration(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Padding(
                  padding: EdgeInsets.only(top: 0, bottom: 8),
                  child: Text(
                    'Quando será sua coleta?',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    SizedBox(
                      width: 32,
                      height: 32,
                      child: IconButton(
                        onPressed: () => _mudarMes(-1),
                        icon: const Icon(LucideIcons.chevronLeft, size: 22),
                        color: Solus.green,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        tooltip: 'Mês anterior',
                      ),
                    ),
                    Text(
                      '${_monthNames[_currentMonth - 1]} $_currentYear',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(
                      width: 32,
                      height: 32,
                      child: IconButton(
                        onPressed: () => _mudarMes(1),
                        icon: const Icon(LucideIcons.chevronRight, size: 22),
                        color: Solus.green,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        tooltip: 'Próximo mês',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                GridView.count(
                  crossAxisCount: 7,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    for (final weekday in _weekdays)
                      Center(
                        child: Text(
                          weekday,
                          style: const TextStyle(
                            fontSize: 11,
                            color: Solus.muted,
                          ),
                        ),
                      ),
                    for (final dia in _dias)
                      if (dia == null)
                        const SizedBox.shrink()
                      else
                        GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onTap: _passado(dia)
                              ? null
                              : () => setState(() => _selectedDay = dia),
                          child: AspectRatio(
                            aspectRatio: 1,
                            child: Container(
                              margin: const EdgeInsets.all(2),
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: _selectedDay == dia
                                    ? Solus.green
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                '${dia.day}',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: _selectedDay == dia
                                      ? FontWeight.w700
                                      : FontWeight.w400,
                                  color: _selectedDay == dia
                                      ? Colors.white
                                      : _passado(dia)
                                      ? Solus.inactive
                                      : Solus.ink,
                                ),
                              ),
                            ),
                          ),
                        ),
                  ],
                ),
                _label(
                  'Quais materiais serão coletados?',
                  helper:
                      '*Essa empresa só realiza coletas de Metal e/ou Vidro',
                ),
                DropdownButtonFormField<String>(
                  initialValue: _material,
                  decoration: const InputDecoration(),
                  items: const [
                    DropdownMenuItem(value: 'Metal', child: Text('Metal')),
                    DropdownMenuItem(value: 'Vidro', child: Text('Vidro')),
                  ],
                  onChanged: (valor) =>
                      setState(() => _material = valor ?? 'Metal'),
                ),
                _label(
                  'Qual o peso aproximado da sua separação?',
                  helper: '*Essa empresa só realiza coletas a partir de 10kg',
                ),
                DropdownButtonFormField<String>(
                  initialValue: _peso,
                  decoration: const InputDecoration(),
                  items: [
                    for (final valor in _weights)
                      DropdownMenuItem(value: valor, child: Text('${valor}kg')),
                  ],
                  onChanged: (valor) => setState(() => _peso = valor ?? '10'),
                ),
                _label('Horário de recebimento'),
                DropdownButtonFormField<String>(
                  initialValue: _selectedTime,
                  decoration: const InputDecoration(),
                  items: [
                    for (final valor in _times)
                      DropdownMenuItem(value: valor, child: Text(valor)),
                  ],
                  onChanged: (valor) =>
                      setState(() => _selectedTime = valor ?? '14:30'),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 14),
                  child: CheckboxListTile(
                    value: _useDefaultAddress,
                    onChanged: (valor) =>
                        setState(() => _useDefaultAddress = valor ?? false),
                    title: const Text(
                      'Utilizar endereço e contatos do cadastro',
                      style: TextStyle(fontSize: 13, color: Solus.muted),
                    ),
                    controlAffinity: ListTileControlAffinity.leading,
                    activeColor: Solus.green,
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                  ),
                ),
                _label('Tem alguma observação?'),
                TextField(
                  controller: _observacaoController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    hintText: 'Comente sobre seus itens, horários para recebimento, etc..',
                    alignLabelWithHint: true,
                  ),
                ),
                if (_error.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(
                      _error,
                      style: const TextStyle(fontSize: 13, color: Solus.danger),
                    ),
                  ),
                const SizedBox(height: 18),
                SolusButton(
                  _loading ? 'Agendando...' : 'Agendar coleta',
                  loading: _loading,
                  minWidth: double.infinity,
                  onPressed: _loading ? null : _enviar,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
