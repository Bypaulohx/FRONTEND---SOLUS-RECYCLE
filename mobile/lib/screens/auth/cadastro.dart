import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../../app.dart';
import '../../providers/session.dart';
import '../../services/api.dart';
import '../../theme.dart';
import '../../utils/format.dart';
import '../../widgets/ui.dart';
import 'common.dart';

/// Cadastro em duas etapas: escolha de tipo e formulário completo.
class CadastroScreen extends StatefulWidget {
  const CadastroScreen({super.key});

  @override
  State<CadastroScreen> createState() => _CadastroScreenState();
}

class _CadastroScreenState extends State<CadastroScreen> {
  static const _materiaisDisponiveis = <String>[
    'Papel',
    'Plástico',
    'Vidro',
    'Metal',
    'Eletrônicos',
    'Orgânico',
  ];

  final _nome = TextEditingController();
  final _nomeFantasia = TextEditingController();
  final _razaoSocial = TextEditingController();
  final _email = TextEditingController();
  final _documento = TextEditingController();
  final _senha = TextEditingController();
  final _confirmaSenha = TextEditingController();
  final _telefone = TextEditingController();
  final _cep = TextEditingController();
  final _rua = TextEditingController();
  final _numero = TextEditingController();
  final _complemento = TextEditingController();
  final _bairro = TextEditingController();
  final _cidade = TextEditingController();
  final _estado = TextEditingController();
  final _descricao = TextEditingController();
  final _pesoMin = TextEditingController();
  final _pesoMax = TextEditingController();

  final List<String> _materiaisSelecionados = <String>[];

  String? _tipo;
  bool _loading = false;
  bool _cepLoading = false;
  bool _fazColetaDomicilio = false;
  String? _error;
  String? _availabilityError;
  int _checkId = 0;

  @override
  void dispose() {
    for (final controller in <TextEditingController>[
      _nome,
      _nomeFantasia,
      _razaoSocial,
      _email,
      _documento,
      _senha,
      _confirmaSenha,
      _telefone,
      _cep,
      _rua,
      _numero,
      _complemento,
      _bairro,
      _cidade,
      _estado,
      _descricao,
      _pesoMin,
      _pesoMax,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  /// CPF/CNPJ progressivo como no React; Masks.document completa os formatos finais.
  String _documentMask(String raw) {
    final d = Masks.digits(raw, 14);
    if (d.isEmpty) return '';
    if (d.length > 11) {
      if (d.length == 14) return Masks.document(d);
      var value = d;
      value = value.replaceFirst(RegExp(r'^(\d{2})(\d)'), r'$1.$2');
      value = value.replaceFirst(RegExp(r'^(\d{2})\.(\d{3})(\d)'), r'$1.$2.$3');
      value = value.replaceFirst(
        RegExp(r'^(\d{2})\.(\d{3})\.(\d{3})(\d)'),
        r'$1.$2.$3/$4',
      );
      value = value.replaceFirst(
        RegExp(r'^(\d{2})\.(\d{3})\.(\d{3})/(\d{4})(\d)'),
        r'$1.$2.$3/$4-$5',
      );
      return value;
    }
    if (d.length == 11) return Masks.document(d);
    var value = d;
    value = value.replaceFirst(RegExp(r'^(\d{3})(\d)'), r'$1.$2');
    value = value.replaceFirst(RegExp(r'^(\d{3})\.(\d{3})(\d)'), r'$1.$2.$3');
    value = value.replaceFirst(
      RegExp(r'^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$'),
      r'$1.$2.$3-$4',
    );
    return value;
  }

  void _setMasked(
    TextEditingController controller,
    String raw,
    String Function(String) mask,
  ) {
    final masked = mask(raw);
    controller.value = TextEditingValue(
      text: masked,
      selection: TextSelection.collapsed(offset: masked.length),
    );
  }

  void _selectTipo(String? tipo) {
    setState(() {
      _tipo = tipo;
      _error = null;
      _availabilityError = null;
    });
  }

  void _onDocumentChanged(String value) {
    _setMasked(_documento, value, _documentMask);
    setState(() => _availabilityError = null);
    final digits = Masks.digits(_documento.text, 14);
    if (digits.length == 11) {
      _check('cpf', digits, 'Este CPF já está cadastrado.');
    } else if (digits.length == 14) {
      _check('cnpj', digits, 'Este CNPJ já está cadastrado.');
    }
  }

  void _onEmailChanged(String value) {
    setState(() => _availabilityError = null);
    final email = value.trim();
    if (email.contains('@') && email.length > 6) {
      _check('email', email.toLowerCase(), 'Este e-mail já está em uso.');
    }
  }

  Future<void> _check(String field, String value, String fallback) async {
    final id = ++_checkId;
    final result = await ApiClient.check(field, value);
    if (!mounted || id != _checkId || result.error != null) return;
    final data = result.data;
    final unique = data is Map ? data['unique'] : null;
    if (unique == false) {
      final message = data is Map ? data['message']?.toString() : null;
      setState(() {
        _availabilityError = (message == null || message.isEmpty)
            ? fallback
            : message;
      });
    } else if (_availabilityError == fallback) {
      setState(() => _availabilityError = null);
    }
  }

  Future<void> _buscarCep() async {
    final digits = Masks.digits(_cep.text, 8);
    if (digits.length != 8 || _cepLoading) return;
    setState(() => _cepLoading = true);
    final result = await ApiClient.cep(digits);
    if (!mounted) return;
    setState(() => _cepLoading = false);
    final data = result.data;
    if (result.error != null || data == null) {
      setState(() => _error = result.error ?? 'Não foi possível buscar o CEP.');
      return;
    }
    setState(() {
      _cep.text = Masks.cep(data.cep);
      if ((data.rua ?? '').isNotEmpty) _rua.text = data.rua!;
      if ((data.bairro ?? '').isNotEmpty) _bairro.text = data.bairro!;
      if ((data.cidade ?? '').isNotEmpty) _cidade.text = data.cidade!;
      if ((data.estado ?? '').isNotEmpty) _estado.text = data.estado!;
    });
  }

  double? _peso(String value) {
    final trimmed = value.trim().replaceAll(',', '.');
    if (trimmed.isEmpty) return null;
    return double.tryParse(trimmed);
  }

  Future<void> _submit() async {
    if (_tipo == null) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _error = null;
    });

    if (_senha.text != _confirmaSenha.text) {
      setState(() => _error = 'As senhas não coincidem.');
      return;
    }
    if (_senha.text.length < 8) {
      setState(() => _error = 'A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    final documento = Masks.digits(_documento.text, 14);
    if (documento.length != 11 && documento.length != 14) {
      setState(
        () => _error = 'Informe um CPF (000.000.000-00) ou CNPJ (00.000.000/0001-00) válido.',
      );
      return;
    }
    if (_tipo == 'organizacao' && _materiaisSelecionados.isEmpty) {
      setState(
        () =>
            _error = 'Selecione ao menos um material que a organização recebe.',
      );
      return;
    }
    if (_availabilityError != null) {
      setState(() => _error = _availabilityError);
      return;
    }

    final endereco = <String, dynamic>{
      'cep': Masks.digits(_cep.text, 8),
      'rua': _rua.text.trim(),
      'numero': _numero.text.trim(),
      'complemento': _complemento.text.trim(),
      'bairro': _bairro.text.trim(),
      'cidade': _cidade.text.trim(),
      'estado': _estado.text.trim(),
    };
    final email = _email.text.trim();
    final telefone = Masks.digits(_telefone.text, 11);
    final materiais = _materiaisSelecionados.join(', ');

    final Map<String, dynamic> body = _tipo == 'comunidade'
        ? <String, dynamic>{
            'nome': _nome.text.trim(),
            'cpf': documento,
            'email': email,
            'senha': _senha.text,
            'telefone': telefone,
            'endereco': endereco,
          }
        : <String, dynamic>{
            'nomeFantasia': _nomeFantasia.text.trim().isNotEmpty
                ? _nomeFantasia.text.trim()
                : _razaoSocial.text.trim(),
            'razaoSocial': _razaoSocial.text.trim().isNotEmpty
                ? _razaoSocial.text.trim()
                : _nomeFantasia.text.trim(),
            'cnpj': documento,
            'email': email,
            'senha': _senha.text,
            'telefone': telefone,
            'descricao': _descricao.text.trim(),
            'tipoResiduo': materiais,
            'materiaisColeta': materiais,
            'fazColetaDomicilio': _fazColetaDomicilio,
            'pesoMinimoKg': _peso(_pesoMin.text),
            'pesoMaximoKg': _peso(_pesoMax.text),
            'endereco': endereco,
          };

    setState(() => _loading = true);
    final result = _tipo == 'comunidade'
        ? await ApiClient.registerUser(body)
        : await ApiClient.registerCompany(body);
    if (!mounted) return;
    setState(() => _loading = false);
    if (result.error != null) {
      setState(() => _error = result.error);
      return;
    }

    context.read<Session>().recoveryEmail = email;
    go(context, '/verificacao', {'email': email, 'modo': 'register'});
  }

  Widget _input(
    String hint,
    TextEditingController controller, {
    TextInputType keyboardType = TextInputType.text,
    List<TextInputFormatter>? inputFormatters,
    void Function(String)? onChanged,
    void Function()? onEditingComplete,
    int? maxLength,
    TextCapitalization textCapitalization = TextCapitalization.none,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      onChanged: onChanged,
      onEditingComplete: onEditingComplete,
      maxLength: maxLength,
      maxLengthEnforcement: maxLength == null
          ? null
          : MaxLengthEnforcement.enforced,
      textCapitalization: textCapitalization,
      autocorrect: false,
      decoration: InputDecoration(hintText: hint, counterText: ''),
    );
  }

  Widget _sectionTitle(IconData icon, String label) {
    return Padding(
      padding: const EdgeInsets.only(top: 4, bottom: 2),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Solus.green),
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }

  Widget _typeCard({
    required IconData icon,
    required String title,
    required String description,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(Solus.radius),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: Solus.cardDecoration(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: Solus.greenSoft,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, size: 30, color: Solus.greenDark),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Text(
              description,
              style: const TextStyle(
                fontSize: 13,
                height: 1.45,
                color: Solus.muted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTypeSelection(BuildContext context) {
    return AuthPage(
      showBack: true,
      onBack: () => replace(context, '/'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AuthTitle('Olá!\nVamos começar?'),
          const Padding(
            padding: EdgeInsets.only(top: 8, bottom: 16),
            child: Text(
              'Escolha como você quer usar a Solus Recycle. Você poderá informar CPF ou CNPJ em qualquer uma das opções.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, height: 1.5, color: Solus.muted),
            ),
          ),
          _typeCard(
            icon: LucideIcons.users,
            title: 'Comunidade',
            description: 'Descarte seus resíduos e encontre pontos de coleta perto de você.',
            onTap: () => _selectTipo('comunidade'),
          ),
          const SizedBox(height: 12),
          _typeCard(
            icon: LucideIcons.building2,
            title: 'Organizações Sociais',
            description: 'Cadastre sua organização, seus materiais e seus pontos de coleta no mapa.',
            onTap: () => _selectTipo('organizacao'),
          ),
          Padding(
            padding: const EdgeInsets.only(top: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'Já tem uma conta? ',
                  style: TextStyle(fontSize: 14, color: Solus.muted),
                ),
                LinkAction('Faça seu login', () => go(context, '/login')),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildForm(BuildContext context) {
    final company = _tipo == 'organizacao';
    final documentHint = Masks.digits(_documento.text, 14).length > 11
        ? '00.000.000/0001-00 (CNPJ)'
        : '000.000.000-00 (CPF ou CNPJ)';

    return AuthPage(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: Row(
              children: [
                SolusBackButton(onPressed: () => _selectTipo(null)),
                const SizedBox(width: 6),
                const Text(
                  'Quem é você',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Solus.greenDark,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          AuthTitle(
            company ? 'Cadastro da organização' : 'Cadastro da comunidade',
          ),
          Padding(
            padding: const EdgeInsets.only(top: 8, bottom: 28),
            child: Text(
              company
                  ? 'Conte sobre sua organização para publicar seus pontos no mapa.'
                  : 'Informe seus dados para encontrar pontos de coleta.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                height: 1.5,
                color: Solus.muted,
              ),
            ),
          ),
          if (company) ...[
            _input('Nome fantasia', _nomeFantasia),
            const SizedBox(height: 16),
            _input('Razão social', _razaoSocial),
          ] else
            _input('Nome completo', _nome),
          const SizedBox(height: 16),
          _input(
            'E-mail',
            _email,
            keyboardType: TextInputType.emailAddress,
            onChanged: _onEmailChanged,
          ),
          const SizedBox(height: 16),
          _input(
            documentHint,
            _documento,
            keyboardType: TextInputType.number,
            onChanged: _onDocumentChanged,
          ),
          const SizedBox(height: 16),
          PasswordField(controller: _senha, label: 'Senha', hint: 'Senha'),
          const SizedBox(height: 16),
          PasswordField(
            controller: _confirmaSenha,
            label: 'Confirme a senha',
            hint: 'Confirme a senha',
          ),
          const SizedBox(height: 16),
          _input(
            'Telefone para contato',
            _telefone,
            keyboardType: TextInputType.phone,
            onChanged: (value) => _setMasked(_telefone, value, Masks.phone),
          ),
          const SizedBox(height: 16),
          _sectionTitle(LucideIcons.mapPin, 'Endereço'),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: _input(
                  'CEP',
                  _cep,
                  keyboardType: TextInputType.number,
                  onChanged: (value) => _setMasked(_cep, value, Masks.cep),
                  onEditingComplete: _buscarCep,
                ),
              ),
              const SizedBox(width: 10),
              SizedBox(
                width: 86,
                height: 49,
                child: OutlinedButton(
                  onPressed: _cepLoading ? null : _buscarCep,
                  style: OutlinedButton.styleFrom(
                    backgroundColor: Solus.greenSoft,
                    foregroundColor: Solus.greenDark,
                    side: const BorderSide(color: Solus.green),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(Solus.radius),
                    ),
                    textStyle: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  child: _cepLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Solus.greenDark,
                          ),
                        )
                      : const Text('Buscar'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _input('Rua / Avenida', _rua),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _input('Número', _numero)),
              const SizedBox(width: 10),
              Expanded(child: _input('Complemento', _complemento)),
            ],
          ),
          const SizedBox(height: 16),
          _input('Bairro', _bairro),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _input('Cidade', _cidade)),
              const SizedBox(width: 10),
              SizedBox(
                width: 84,
                child: _input(
                  'Estado',
                  _estado,
                  maxLength: 2,
                  textCapitalization: TextCapitalization.characters,
                ),
              ),
            ],
          ),
          if (company) ...[
            const SizedBox(height: 20),
            _sectionTitle(LucideIcons.recycle, 'Coleta e materiais'),
            const SizedBox(height: 12),
            TextField(
              controller: _descricao,
              maxLines: 3,
              autocorrect: false,
              decoration: const InputDecoration(
                hintText: 'Descrição',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Checkbox(
                  value: _fazColetaDomicilio,
                  onChanged: (value) =>
                      setState(() => _fazColetaDomicilio = value ?? false),
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                const SizedBox(width: 6),
                GestureDetector(
                  onTap: () => setState(
                    () => _fazColetaDomicilio = !_fazColetaDomicilio,
                  ),
                  child: const Text(
                    'Faz coleta em domicílio',
                    style: TextStyle(fontSize: 13, color: Solus.muted),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _materiaisDisponiveis.map((material) {
                final selected = _materiaisSelecionados.contains(material);
                return InkWell(
                  onTap: () => setState(() {
                    if (selected) {
                      _materiaisSelecionados.remove(material);
                    } else {
                      _materiaisSelecionados.add(material);
                    }
                  }),
                  borderRadius: BorderRadius.circular(999),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 13,
                      vertical: 8,
                    ),
                    constraints: const BoxConstraints(minHeight: 38),
                    decoration: BoxDecoration(
                      color: selected ? Solus.greenSoft : Solus.surface,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(
                        color: selected ? Solus.green : Solus.border,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (selected) ...[
                          const Icon(
                            LucideIcons.check,
                            size: 14,
                            color: Solus.greenDark,
                          ),
                          const SizedBox(width: 5),
                        ],
                        Text(
                          material,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: selected ? Solus.greenDark : Solus.muted,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _input(
                    'Mín. kg por coleta',
                    _pesoMin,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _input(
                    'Máx. kg por coleta',
                    _pesoMax,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 16),
          FormError(_error),
          SolusButton(
            _loading ? 'Cadastrando...' : 'Avançar',
            onPressed: _submit,
            loading: _loading,
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Text(
              'Ou cadastre-se com',
              style: TextStyle(fontSize: 14, color: Solus.muted),
            ),
          ),
          const SocialButtons(),
          Padding(
            padding: const EdgeInsets.only(top: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'Já tem uma conta? ',
                  style: TextStyle(fontSize: 14, color: Solus.muted),
                ),
                LinkAction('Faça seu login', () => go(context, '/login')),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_tipo == null) return _buildTypeSelection(context);
    return _buildForm(context);
  }
}
