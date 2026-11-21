import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app.dart';
import '../../providers/session.dart';
import '../../theme.dart';
import '../../widgets/ui.dart';
import 'common.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _submit() async {
    if (_email.text.trim().isEmpty || _password.text.isEmpty) {
      setState(() => _error = 'Informe seu e-mail e sua senha.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    final error = await context.read<Session>().login(_email.text, _password.text);
    if (!mounted) return;
    setState(() {
      _loading = false;
      _error = error;
    });
    if (error == null) goHome(context);
  }

  @override
  Widget build(BuildContext context) {
    return AuthPage(
      showBack: true,
      onBack: () => replace(context, '/'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AuthTitle('Bem-vindo de volta!\nFaça seu login'),
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
            decoration: const InputDecoration(labelText: 'E-mail', hintText: 'Digite seu email'),
          ),
          const SizedBox(height: 16),
          PasswordField(controller: _password, label: 'Senha', hint: 'Digite sua senha'),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: LinkAction('Esqueceu a senha?', () => go(context, '/recuperacao')),
          ),
          const SizedBox(height: 12),
          FormError(_error),
          SolusButton('Entrar', onPressed: _submit, loading: _loading),
          const SocialButtons(),
          Padding(
            padding: const EdgeInsets.only(top: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('Ainda não tem uma conta? ', style: TextStyle(fontSize: 14, color: Solus.muted)),
                LinkAction('Faça seu cadastro', () => go(context, '/cadastro')),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
