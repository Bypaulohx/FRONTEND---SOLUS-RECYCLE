import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../../providers/session.dart';
import '../../services/api.dart';
import '../../services/external.dart';
import '../../theme.dart';
import '../../widgets/ui.dart';

/// Casca das telas de autenticação (sem header/nav do Layout).
class AuthPage extends StatelessWidget {
  final Widget child;
  final bool showBack;
  final VoidCallback? onBack;
  final EdgeInsetsGeometry padding;

  const AuthPage({
    super.key,
    required this.child,
    this.showBack = false,
    this.onBack,
    this.padding = const EdgeInsets.fromLTRB(20, 72, 20, 32),
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Solus.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: padding,
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: Solus.appWidth),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (showBack)
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 18),
                        child: SolusBackButton(onPressed: onBack),
                      ),
                    ),
                  child,
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class AuthTitle extends StatelessWidget {
  final String title;
  final String? subtitle;

  const AuthTitle(this.title, {super.key, this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, height: 1.3)),
        if (subtitle != null)
          Padding(
            padding: const EdgeInsets.only(top: 8, bottom: 28),
            child: Text(subtitle!, style: const TextStyle(fontSize: 14, color: Solus.muted, height: 1.5)),
          ),
      ],
    );
  }
}

class FormError extends StatelessWidget {
  final String? message;

  const FormError(this.message, {super.key});

  @override
  Widget build(BuildContext context) {
    if (message == null || message!.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(message!, style: const TextStyle(fontSize: 13, color: Solus.danger)),
    );
  }
}

class FormSuccess extends StatelessWidget {
  final String? message;

  const FormSuccess(this.message, {super.key});

  @override
  Widget build(BuildContext context) {
    if (message == null || message!.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(message!, style: const TextStyle(fontSize: 13, color: Solus.greenDark)),
    );
  }
}

class PasswordField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;

  const PasswordField({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
  });

  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _visible = false;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: widget.controller,
      obscureText: !_visible,
      autocorrect: false,
      enableSuggestions: false,
      decoration: InputDecoration(
        labelText: widget.label,
        hintText: widget.hint ?? widget.label,
        suffixIcon: IconButton(
          onPressed: () => setState(() => _visible = !_visible),
          icon: Icon(_visible ? LucideIcons.eyeOff : LucideIcons.eye, size: 21, color: Solus.muted),
          tooltip: _visible ? 'Ocultar senha' : 'Mostrar senha',
        ),
      ),
    );
  }
}

/// Botões de login social (Apple, Facebook, Google) com fallback demo.
class SocialButtons extends StatefulWidget {
  const SocialButtons({super.key});

  @override
  State<SocialButtons> createState() => _SocialButtonsState();
}

class _SocialButtonsState extends State<SocialButtons> {
  String? _loading;
  String? _message;

  static const providers = [
    ('apple', 'Apple', 'assets/images/Apple (Button).png'),
    ('facebook', 'Facebook', 'assets/images/Facebook (Button).png'),
    ('google', 'Google', 'assets/images/Google (Button).png'),
  ];

  Future<void>_handle(String provider, String label) async {
    setState(() {
      _loading = provider;
      _message = null;
    });
    final result = await ApiClient.socialUrl(provider);
    final data = result.data;
    final url = data is Map ? data['url']?.toString() : null;
    final demo = data is Map && data['demo'] == true;
    if (result.error != null || url == null || url.isEmpty) {
      setState(() => _message = 'Login com $label ainda não está configurado.');
      return;
    }
    if (demo) {
      final login = await ApiClient.socialDemo(provider);
      if (!login.ok || login.data == null) {
        setState(() => _message = login.error ?? 'Não foi possível concluir o login social.');
        return;
      }
      if (!mounted) return;
      final session = context.read<Session>();
      await session.loginWithToken(login.data!.jwtToken, login.data!.role);
      if (!mounted) return;
      Navigator.of(context).pushNamedAndRemoveUntil('/home', (_) => false);
      return;
    }
    await External.open(url);
    if (mounted) setState(() => _message = 'Abrindo $provider...');
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 8),
          child: Text('Ou entre com', style: TextStyle(fontSize: 14, color: Solus.muted)),
        ),
        Row(
          children: providers.map((p) {
            final busy = _loading != null;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 5),
                child: SizedBox(
                  height: 68,
                  child: OutlinedButton(
                    onPressed: busy ? null : () => _handle(p.$1, p.$2),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Solus.border),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Solus.radius)),
                    ),
                    child: _loading == p.$1
                        ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                        : Image.asset(p.$3, height: 42, width: 42, errorBuilder: (_, _, _) => Icon(LucideIcons.userRound, color: Solus.greenDark)),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        if (_message != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(_message!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: Solus.danger)),
          ),
      ],
    );
  }
}
