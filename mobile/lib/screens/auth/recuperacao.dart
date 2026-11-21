import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app.dart';
import '../../providers/session.dart';
import '../../services/api.dart';
import '../../theme.dart';
import '../../widgets/ui.dart';
import 'common.dart';

/// Recuperação de senha: identificado + tipo de principal + envio do código.
class RecuperacaoScreen extends StatefulWidget {
  const RecuperacaoScreen({super.key});

  @override
  State<RecuperacaoScreen> createState() => _RecuperacaoScreenState();
}

class _RecuperacaoScreenState extends State<RecuperacaoScreen> {
  final _identifier = TextEditingController();
  String _principalType = 'USER';
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _identifier.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    setState(() {
      _error = null;
      _loading = true;
    });
    final identifier = _identifier.text.trim();
    final result = await ApiClient.initiateReset(identifier, _principalType);
    if (!mounted) return;
    setState(() {
      _loading = false;
      _error = result.error;
    });
    if (result.error != null) return;

    context.read<Session>().recoveryEmail = identifier;
    go(context, '/verificacao', {
      'email': identifier,
      'modo': 'reset',
      'principalType': _principalType,
    });
  }

  Widget _option(String label, String value) {
    final selected = _principalType == value;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _principalType = value),
        borderRadius: BorderRadius.circular(Solus.radius),
        child: Container(
          height: 44,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? Solus.green : const Color(0xFFF0F0F0),
            borderRadius: BorderRadius.circular(Solus.radius),
            border: Border.all(color: selected ? Solus.green : Solus.border),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: selected ? Colors.white : Solus.muted,
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AuthPage(
      showBack: true,
      onBack: () => go(context, '/login'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AuthTitle(
            'Esqueceu sua senha?',
            subtitle: 'Por favor, insira o e-mail vinculado à sua conta',
          ),
          Row(
            children: [
              _option('Comunidade', 'USER'),
              const SizedBox(width: 10),
              _option('Organizações Sociais', 'COMPANY'),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _identifier,
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
            decoration: const InputDecoration(
              labelText: null,
              hintText: 'Digite seu email',
            ),
          ),
          const SizedBox(height: 12),
          FormError(_error),
          SolusButton(
            _loading ? 'Enviando...' : 'Continuar',
            onPressed: _submit,
            loading: _loading,
          ),
          Padding(
            padding: const EdgeInsets.only(top: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'Lembrou da senha? ',
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
}
