import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../../app.dart';
import '../../models.dart';
import '../../providers/session.dart';
import '../../services/api.dart';
import '../../services/external.dart';
import '../../services/local_data.dart';
import '../../services/storage.dart';
import '../../theme.dart';
import '../../widgets/ui.dart';

class ConversasScreen extends StatefulWidget {
  const ConversasScreen({super.key, required this.params});

  final Map<String, String> params;

  @override
  State<ConversasScreen> createState() => _ConversasScreenState();
}

class _ConversasScreenState extends State<ConversasScreen> {
  static const List<String> _respostasRapidas = [
    'Estou a caminho',
    'Pode deixar na portaria',
    'Preciso de ajuda',
  ];

  final ScrollController _threadController = ScrollController();
  final TextEditingController _composerController = TextEditingController();

  List<Agendamento> _agendamentos = const [];
  List<ChatMessage> _mensagens = const [];
  Map<int, String> _previews = const {};
  String _texto = '';
  String _erro = '';
  bool _carregando = true;
  int? _demoId;

  bool get _isCompany => Provider.of<Session>(context, listen: false).isCompany;
  String get _role => _isCompany ? 'COMPANY' : 'USER';

  int? get _coletaId {
    final alvo = int.tryParse(widget.params['coleta'] ?? '');
    if (alvo != null && _agendamentos.any((item) => item.id == alvo)) {
      return alvo;
    }
    if (_demoId != null && _agendamentos.any((item) => item.id == _demoId)) {
      return _demoId;
    }
    return null;
  }

  Agendamento? get _coleta {
    final id = _coletaId;
    if (id == null) return null;
    return _agendamentos.where((item) => item.id == id).firstOrNull;
  }

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  @override
  void dispose() {
    _threadController.dispose();
    _composerController.dispose();
    super.dispose();
  }

  Future<void> _carregar() async {
    final demo = await Prefs.read(Prefs.demoColetaKey);
    final company = _isCompany;
    final empresaParam = int.tryParse(widget.params['empresa'] ?? '');
    final empresaSalva = int.tryParse(
      await Prefs.read(Prefs.companyIdKey) ?? '',
    );

    final result = company
        ? await ApiClient.agendamentosDaEmpresa(
            empresaParam ?? empresaSalva ?? 0,
          )
        : await ApiClient.meusAgendamentos();

    final previews = <int, String>{};
    if (result.ok && result.data != null) {
      for (final agendamento in result.data!) {
        final mensagens = await LocalData.messages(agendamento.id.toString());
        previews[agendamento.id] = mensagens.isEmpty
            ? 'Toque para abrir a conversa'
            : mensagens.last.text;
      }
    }
    if (!mounted) return;
    setState(() {
      _demoId = int.tryParse(demo ?? '');
      _carregando = false;
      if (result.error != null) {
        _erro = result.error!;
      } else {
        _agendamentos = result.data ?? const [];
        _previews = previews;
      }
    });
    await _carregarMensagens();
  }

  Future<void> _carregarMensagens() async {
    final id = _coletaId;
    if (id == null) {
      if (!mounted) return;
      setState(() => _mensagens = const []);
      return;
    }
    final mensagens = await LocalData.messages(id.toString());
    if (!mounted) return;
    setState(() => _mensagens = mensagens);
    _rolarFim();
  }

  void _rolarFim() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_threadController.hasClients) {
        _threadController.jumpTo(_threadController.position.maxScrollExtent);
      }
    });
  }

  Future<void> _enviar(String conteudo) async {
    final limpo = conteudo.trim();
    final id = _coletaId;
    if (id == null || limpo.isEmpty) return;
    await LocalData.sendMessage(id.toString(), limpo, _role);
    _texto = '';
    _composerController.clear();
    if (!mounted) return;
    setState(() {});
    await _carregarMensagens();
    if (!mounted) return;
    setState(() {
      _previews = {..._previews, id: limpo};
    });
  }

  Future<void> _avisarELigar() async {
    final coleta = _coleta;
    if (coleta == null) return;
    final numero = _isCompany ? coleta.userTelefone : coleta.companyTelefone;
    if (numero == null || numero.isEmpty) {
      if (!mounted) return;
      setState(() => _erro = 'Telefone não cadastrado para este contato.');
      return;
    }
    await _enviar('Estou chegando para a coleta!');
    await External.call(numero);
  }

  String _nomeContato(Agendamento coleta) => _isCompany
      ? (coleta.userName ?? 'Morador')
      : (coleta.companyNomeFantasia ?? 'Solus Reciclagem');

  String _avatarTexto(String nome) => nome.isEmpty
      ? 'SR'
      : nome.substring(0, nome.length > 2 ? 2 : nome.length).toUpperCase();

  @override
  Widget build(BuildContext context) {
    final thread = widget.params['coleta'] != null;

    return AppScaffold(
      currentPath: '/conversas',
      child: _carregando
          ? const LoadingView()
          : thread
          ? _thread(context)
          : _lista(context),
    );
  }

  Widget _lista(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 30),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: const BoxDecoration(
                  color: Solus.greenSoft,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  LucideIcons.messageCircle,
                  size: 20,
                  color: Solus.greenDark,
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Conversas',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'Mensagens sobre suas coletas',
                      style: TextStyle(fontSize: 11, color: Solus.muted),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (_erro.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(
                _erro,
                style: const TextStyle(fontSize: 13, color: Solus.danger),
              ),
            ),
          if (_agendamentos.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 20),
              child: EmptyState('Você ainda não tem conversas de coleta.'),
            ),
          const SizedBox(height: 12),
          ..._agendamentos.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _conversationTile(item),
            ),
          ),
        ],
      ),
    );
  }

  Widget _conversationTile(Agendamento item) {
    final nome = _nomeContato(item);
    return InkWell(
      onTap: () => go(context, '/conversas', {'coleta': '${item.id}'}),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Solus.surface,
          borderRadius: BorderRadius.circular(Solus.radius),
          border: Border.all(color: Solus.border),
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
                _avatarTexto(nome),
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
                    nome,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Coleta #${item.id} · ${item.tipoResiduo ?? 'Recicláveis'}',
                    style: const TextStyle(fontSize: 10, color: Solus.muted),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _previews[item.id] ?? 'Toque para abrir a conversa',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 10, color: Solus.muted),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _thread(BuildContext context) {
    final coleta = _coleta;
    final nome = coleta != null ? _nomeContato(coleta) : 'Conversa';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
          child: SolusBackButton(onPressed: () => go(context, '/conversas')),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
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
                  _avatarTexto(nome),
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
                      nome,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      coleta != null
                          ? 'Coleta #${coleta.id} · ${coleta.companyNomeFantasia ?? 'Solus Reciclagem'}'
                          : 'Conversas sobre coletas',
                      style: const TextStyle(fontSize: 11, color: Solus.muted),
                    ),
                  ],
                ),
              ),
              if (coleta != null)
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: Solus.greenSoft,
                    borderRadius: BorderRadius.circular(Solus.radius),
                    border: Border.all(color: Solus.border),
                  ),
                  child: IconButton(
                    onPressed: () async {
                      final confirmou = await confirmDialog(
                        context,
                        title: 'Avisar que chegou?',
                        message: 'Vamos avisar no chat que você está chegando e abrir o discador com o telefone cadastrado.',
                        confirmLabel: 'Avisar e ligar',
                        cancelLabel: 'Cancelar',
                      );
                      if (confirmou) await _avisarELigar();
                    },
                    icon: const Icon(
                      LucideIcons.phone,
                      size: 19,
                      color: Solus.greenDark,
                    ),
                    tooltip: 'Ligar e avisar chegada',
                  ),
                ),
            ],
          ),
        ),
        if (_erro.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
            child: Text(
              _erro,
              style: const TextStyle(fontSize: 13, color: Solus.danger),
            ),
          ),
        if (coleta == null)
          const Padding(
            padding: EdgeInsets.all(20),
            child: EmptyState('Conversa não encontrada.'),
          )
        else ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Solus.greenSoft,
                borderRadius: BorderRadius.circular(9),
              ),
              child: Row(
                children: [
                  const Icon(
                    LucideIcons.messageCircle,
                    size: 16,
                    color: Solus.greenDark,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '${coleta.tipoResiduo ?? 'Recicláveis'} · ${coleta.pesoEstimado ?? 0} kg · ${coleta.companyNomeFantasia ?? 'Solus Reciclagem'}',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Solus.greenDark,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 210, maxHeight: 340),
            child: SingleChildScrollView(
              controller: _threadController,
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_mensagens.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 40),
                      child: Text(
                        'Nenhuma mensagem ainda. Escreva a primeira para combinar a coleta.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 11, color: Solus.inactive),
                      ),
                    ),
                  ..._mensagens.map((mensagem) => _bubble(mensagem)),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _respostasRapidas
                  .map(
                    (resposta) => InkWell(
                      onTap: () => _enviar(resposta),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 7,
                        ),
                        decoration: BoxDecoration(
                          color: Solus.surface,
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: Solus.greenDark),
                        ),
                        child: Text(
                          resposta,
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: Solus.greenDark,
                          ),
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _composerController,
                    onChanged: (value) => _texto = value,
                    onSubmitted: (value) => _enviar(value),
                    decoration: const InputDecoration(
                      hintText: 'Escreva uma mensagem',
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 47,
                  height: 47,
                  child: FloatingActionButton(
                    onPressed: _texto.trim().isEmpty
                        ? null
                        : () => _enviar(_texto),
                    backgroundColor: Solus.green,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    heroTag: 'chat-send',
                    child: const Icon(LucideIcons.send, size: 18),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _bubble(ChatMessage mensagem) {
    final mine = mensagem.isMine(_role);
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.84,
        ),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: mine ? Solus.green : const Color(0xFFF5F5F5),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              mensagem.text,
              style: TextStyle(
                fontSize: 12,
                height: 1.5,
                color: mine ? Colors.white : Solus.ink,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              mensagem.displayTime,
              style: TextStyle(
                fontSize: 9,
                color: (mine ? Colors.white : Solus.ink).withValues(alpha: .75),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
