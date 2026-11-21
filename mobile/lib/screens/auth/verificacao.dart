import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../app.dart';
import '../../providers/session.dart';
import '../../services/api.dart';
import '../../theme.dart';
import '../../utils/format.dart';
import '../../widgets/ui.dart';
import 'common.dart';

/// Verificação de código de 6 dígitos (cadastro ou redefinição de senha).
class VerificacaoScreen extends StatefulWidget {
  final Map<String, String> params;

  const VerificacaoScreen({super.key, required this.params});

  @override
  State<VerificacaoScreen> createState() => _VerificacaoScreenState();
}

class _VerificacaoScreenState extends State<VerificacaoScreen> {
  static const _codeLength = 6;

  final List<TextEditingController> _controllers = List.generate(
    _codeLength,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _nodes = List.generate(_codeLength, (_) => FocusNode());

  bool _loading = false;
  String? _error;
  String? _info;

  late final String _email;
  late final String _mode;
  late final String _principalType;

  @override
  void initState() {
    super.initState();
    _email =
        widget.params['email'] ?? context.read<Session>().recoveryEmail ?? '';
    _mode = widget.params['modo'] ?? 'reset';
    _principalType = widget.params['principalType'] ?? 'USER';
  }

  @override
  void dispose() {
    for (final controller in _controllers) {
      controller.dispose();
    }
    for (final node in _nodes) {
      node.dispose();
    }
    super.dispose();
  }

  void _handleChange(int index, String value) {
    final digits = Masks.digits(value, 14);
    if (digits.isEmpty) {
      _controllers[index].clear();
      setState(() {
        _error = null;
        _info = null;
      });
      return;
    }

    if (digits.length > 1) {
      final code = digits.length > _codeLength
          ? digits.substring(digits.length - _codeLength)
          : digits;
      for (var i = 0; i < _codeLength; i++) {
        _controllers[i].text = i < code.length ? code[i] : '';
      }
      final next = code.length >= _codeLength ? _codeLength - 1 : code.length;
      _nodes[next].requestFocus();
      setState(() {
        _error = null;
        _info = null;
      });
      return;
    }

    _controllers[index].value = TextEditingValue(
      text: digits,
      selection: TextSelection.collapsed(offset: 1),
    );
    setState(() {
      _error = null;
      _info = null;
    });
    if (index < _codeLength - 1) _nodes[index + 1].requestFocus();
  }

  Future<void> _submit() async {
    final code = _controllers.map((controller) => controller.text).join();
    if (code.length != _codeLength) {
      setState(() => _error = 'Insira o código de $_codeLength dígitos.');
      return;
    }
    if (_email.trim().isEmpty) {
      setState(
        () => _error =
            'E-mail não encontrado. Volte e informe o e-mail novamente.',
      );
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
      _info = null;
    });

    if (_mode == 'register') {
      final result = await ApiClient.verifyRegistration(_email.trim(), code);
      if (!mounted) return;
      setState(() => _loading = false);
      if (result.error != null) {
        setState(() => _error = result.error);
        return;
      }
      go(context, '/sucesso', {'modo': 'register'});
      return;
    }

    final result = await ApiClient.verifyResetCode(code, _principalType);
    if (!mounted) return;
    setState(() => _loading = false);
    if (result.error != null) {
      setState(() => _error = result.error);
      return;
    }
    go(context, '/nova-senha', {'code': code, 'principalType': _principalType});
  }

  Future<void> _resend() async {
    if (_email.trim().isEmpty) {
      setState(
        () => _error = 'Informe seu e-mail novamente para reenviar o código.',
      );
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _info = null;
    });
    final result = _mode == 'register'
        ? await ApiClient.resendVerification(_email.trim())
        : await ApiClient.initiateReset(_email.trim(), _principalType);
    if (!mounted) return;
    setState(() {
      _loading = false;
      if (result.error != null) {
        _error = result.error;
      } else {
        _info = 'Um novo código foi enviado para o seu e-mail.';
      }
    });
  }

  Widget _codeField(int index) {
    return Expanded(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 52),
        child: SizedBox(
          height: 60,
          child: Focus(
            onKeyEvent: (node, event) {
              if (event is KeyDownEvent &&
                  event.logicalKey == LogicalKeyboardKey.backspace &&
                  _controllers[index].text.isEmpty &&
                  index > 0) {
                _nodes[index - 1].requestFocus();
                return KeyEventResult.handled;
              }
              return KeyEventResult.ignored;
            },
            child: TextField(
              controller: _controllers[index],
              focusNode: _nodes[index],
              autofocus: index == 0,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              textAlign: TextAlign.center,
              autocorrect: false,
              enableSuggestions: false,
              onChanged: (value) => _handleChange(index, value),
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: Solus.ink,
              ),
              decoration: const InputDecoration(
                counterText: '',
                contentPadding: EdgeInsets.symmetric(horizontal: 2),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(Solus.radius)),
                  borderSide: BorderSide(color: Solus.border, width: 2),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(Solus.radius)),
                  borderSide: BorderSide(color: Solus.border, width: 2),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(Solus.radius)),
                  borderSide: BorderSide(color: Solus.green, width: 2),
                ),
              ),
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
      onBack: () => go(
        context,
        _mode == 'register' ? '/cadastro' : '/recuperacao',
        _mode == 'register' ? null : widget.params,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AuthTitle(
            'Verificação\nInsira o código de 6 dígitos que enviamos para o seu e-mail',
          ),
          const SizedBox(height: 28),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (var i = 0; i < _codeLength; i++) ...[
                if (i > 0) const SizedBox(width: 10),
                _codeField(i),
              ],
            ],
          ),
          const SizedBox(height: 16),
          FormError(_error),
          FormSuccess(_info),
          SolusButton(
            _loading ? 'Verificando...' : 'Verificar',
            onPressed: _submit,
            loading: _loading,
          ),
          Padding(
            padding: const EdgeInsets.only(top: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'Não recebeu o código? ',
                  style: TextStyle(fontSize: 14, color: Solus.muted),
                ),
                LinkAction('Reenviar código', _resend),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
