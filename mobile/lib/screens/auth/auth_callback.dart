import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app.dart';
import '../../providers/session.dart';
import '../../services/api.dart';
import '../../theme.dart';
import 'common.dart';

/// Destino dos fluxos OAuth (reais ou demonstrativos), espelho de AuthCallback.tsx.
class AuthCallbackScreen extends StatefulWidget {
  final Map<String, String> params;

  const AuthCallbackScreen({super.key, required this.params});

  @override
  State<AuthCallbackScreen> createState() => _AuthCallbackScreenState();
}

class _AuthCallbackScreenState extends State<AuthCallbackScreen> {
  String _message = 'Concluindo seu login...';
  bool _handled = false;

  @override
  void initState() {
    super.initState();
    _concluir();
  }

  void _voltarAoLoginAposDelay() {
    Future.delayed(const Duration(milliseconds: 2500), () {
      if (!mounted || !context.mounted) return;
      replace(context, '/login');
    });
  }

  Future<void> _concluir() async {
    if (_handled) return;
    _handled = true;

    final error = widget.params['error'];
    if (error != null && error.isNotEmpty) {
      setState(() => _message = error);
      _voltarAoLoginAposDelay();
      return;
    }

    final token = widget.params['token'] ?? '';
    final role = widget.params['role'] ?? '';
    final provider = widget.params['provider'] ?? '';
    final name = widget.params['name'] ?? '';
    if (name.isNotEmpty && token.isEmpty && provider.isEmpty) {
      // Provedores que enviam apenas o nome ainda precisam de token válido.
    }

    if (token.isNotEmpty && (role == 'USER' || role == 'COMPANY')) {
      await context.read<Session>().loginWithToken(token, role);
      if (!mounted || !context.mounted) return;
      goHome(context);
      return;
    }

    if (widget.params['demo'] == '1' && provider.isNotEmpty) {
      final result = await ApiClient.socialDemo(
        provider,
        state: widget.params['state'],
      );
      if (!mounted || !context.mounted) return;
      if (result.error != null || result.data == null) {
        setState(
          () => _message =
              result.error ?? 'Não foi possível concluir o login social.',
        );
        _voltarAoLoginAposDelay();
        return;
      }
      await context.read<Session>().loginWithToken(
        result.data!.jwtToken,
        result.data!.role,
      );
      if (!mounted || !context.mounted) return;
      goHome(context);
      return;
    }

    setState(() => _message = 'Solicitação de login social inválida.');
    _voltarAoLoginAposDelay();
  }

  @override
  Widget build(BuildContext context) {
    return AuthPage(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AuthTitle('Solus Recycle'),
          const SizedBox(height: 16),
          Text(
            _message,
            style: const TextStyle(fontSize: 14, color: Solus.muted),
          ),
        ],
      ),
    );
  }
}
