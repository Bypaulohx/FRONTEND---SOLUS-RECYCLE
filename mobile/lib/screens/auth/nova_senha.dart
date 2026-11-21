import 'package:flutter/material.dart';

import '../../app.dart';
import '../../services/api.dart';
import '../../widgets/ui.dart';
import 'common.dart';

/// Criação da nova senha após a verificação do código de recuperação.
class NovaSenhaScreen extends StatefulWidget {
  final Map<String, String> params;

  const NovaSenhaScreen({super.key, required this.params});

  @override
  State<NovaSenhaScreen> createState() => _NovaSenhaScreenState();
}

class _NovaSenhaScreenState extends State<NovaSenhaScreen> {
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _loading = false;
  String? _error;

  late final String _code;
  late final String _principalType;

  @override
  void initState() {
    super.initState();
    _code = widget.params['code'] ?? '';
    _principalType = widget.params['principalType'] ?? 'USER';
  }

  @override
  void dispose() {
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    setState(() => _error = null);

    if (_password.text != _confirm.text) {
      setState(() => _error = 'As senhas não coincidem.');
      return;
    }
    if (_password.text.length < 8) {
      setState(() => _error = 'A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (_code.isEmpty) {
      setState(
        () => _error = 'Sessão inválida. Refaça a recuperação de senha.',
      );
      return;
    }

    setState(() => _loading = true);
    final result = await ApiClient.resetPassword(
      _code,
      _principalType,
      _password.text,
    );
    if (!mounted) return;
    setState(() {
      _loading = false;
      _error = result.error;
    });
    if (result.error != null) return;

    go(context, '/sucesso');
  }

  @override
  Widget build(BuildContext context) {
    return AuthPage(
      showBack: true,
      onBack: () => go(context, '/verificacao', widget.params),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AuthTitle('Pronto!\nCrie uma nova senha'),
          const SizedBox(height: 16),
          PasswordField(
            controller: _password,
            label: 'Digite uma nova senha',
            hint: 'Digite uma nova senha',
          ),
          const SizedBox(height: 16),
          PasswordField(
            controller: _confirm,
            label: 'Confirme a nova senha',
            hint: 'Confirme a nova senha',
          ),
          const SizedBox(height: 16),
          FormError(_error),
          SolusButton(
            _loading ? 'Confirmando...' : 'Confirmar',
            onPressed: _submit,
            loading: _loading,
          ),
        ],
      ),
    );
  }
}
