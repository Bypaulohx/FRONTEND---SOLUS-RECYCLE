import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../app.dart';
import '../../theme.dart';
import '../../widgets/ui.dart';

/// Confirmação visual do cadastro/redefinição concluído.
class SucessoScreen extends StatelessWidget {
  const SucessoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Solus.surface,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const Icon(
                  LucideIcons.circleCheckBig,
                  size: 96,
                  color: Solus.green,
                ),
                const SizedBox(height: 24),
                const Text(
                  'Tudo certo!\nSua senha foi alterada com sucesso!',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                    height: 1.25,
                    color: Solus.ink,
                  ),
                ),
                const SizedBox(height: 24),
                Center(
                  child: SolusButton(
                    'Fazer login',
                    minWidth: 180,
                    onPressed: () => replace(context, '/login'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
