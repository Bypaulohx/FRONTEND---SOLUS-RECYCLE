import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../app.dart';
import '../../theme.dart';
import '../../widgets/ui.dart';

class IndexScreen extends StatelessWidget {
  const IndexScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Solus.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 40, 24, 32),
            child: Column(
              children: [
                Image.asset(
                  'assets/images/Layer_2.png',
                  width: 352,
                  fit: BoxFit.contain,
                  errorBuilder: (_, _, _) => const Icon(LucideIcons.recycle, size: 96, color: Solus.green),
                ),
                const SizedBox(height: 20),
                Image.asset(
                  'assets/images/solus-logo.png',
                  width: 240,
                  fit: BoxFit.contain,
                  errorBuilder: (_, _, _) => const Text(
                    'SOLUS RECYCLE',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Solus.greenDark),
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(width: 300, child: SolusButton('Entrar', onPressed: () => go(context, '/login'))),
                const SizedBox(height: 14),
                SizedBox(
                  width: 300,
                  child: SolusButton(
                    'Quero me cadastrar',
                    outlined: true,
                    onPressed: () => go(context, '/cadastro', {'from': 'index'}),
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
