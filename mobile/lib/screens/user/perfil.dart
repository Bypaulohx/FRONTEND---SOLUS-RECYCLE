import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../../app.dart';
import '../../providers/session.dart';
import '../../theme.dart';
import '../../widgets/ui.dart';

class PerfilScreen extends StatelessWidget {
  const PerfilScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();

    return AppScaffold(
      currentPath: '/perfil',
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              session.me?.nome ?? 'Usuário',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 24),
            _MenuTile(
              icon: LucideIcons.userRound,
              label: 'Meus dados',
              onTap: () => go(context, '/meus-dados'),
            ),
            _MenuTile(
              icon: LucideIcons.bell,
              label: 'Notificações',
              onTap: () => go(context, '/notificacoes'),
            ),
            _MenuTile(
              icon: LucideIcons.circleHelp,
              label: 'Ajuda',
              onTap: () => go(context, '/ajuda'),
            ),
            _MenuTile(
              icon: LucideIcons.logOut,
              label: 'Sair',
              onTap: () => _abrirModalSair(context, session),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _abrirModalSair(BuildContext context, Session session) async {
    bool excluindo = false;
    String erro = '';

    await showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (_, setState) => Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Solus.radius),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 24, 18, 18),
            child: Stack(
              children: [
                Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Sair da conta',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 10),
                      child: Text(
                        'Ao excluir sua conta, seus dados são removidos. Se quiser voltar depois, será necessário criar um novo cadastro.',
                        style: TextStyle(
                          fontSize: 12,
                          color: Solus.muted,
                          height: 1.5,
                        ),
                      ),
                    ),
                    if (erro.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Text(
                          erro,
                          style: const TextStyle(
                            fontSize: 13,
                            color: Solus.danger,
                          ),
                        ),
                      ),
                    SolusButton(
                      'Sair',
                      icon: LucideIcons.logOut,
                      onPressed: () async {
                        Navigator.of(dialogContext).pop();
                        await session.logout();
                        if (context.mounted) {
                          Navigator.of(context)
                              .pushNamedAndRemoveUntil('/', (_) => false);
                        }
                      },
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 47,
                      child: ElevatedButton(
                        onPressed: excluindo
                            ? null
                            : () async {
                                setState(() => excluindo = true);
                                String? failure;
                                try {
                                  await session.deleteAccount();
                                } catch (e) {
                                  failure = e.toString();
                                }
                                setState(() {
                                  excluindo = false;
                                  if (failure != null) erro = failure;
                                });
                                if (failure != null) return;
                                await session.logout();
                                if (context.mounted) {
                                  Navigator.of(dialogContext).pop();
                                  Navigator.of(
                                    context,
                                  ).pushNamedAndRemoveUntil('/', (_) => false);
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Solus.danger,
                          foregroundColor: Colors.white,
                          disabledBackgroundColor: Solus.danger.withValues(
                            alpha: .7,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(Solus.radius),
                          ),
                          textStyle: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(LucideIcons.trash2, size: 17),
                            const SizedBox(width: 8),
                            Text(excluindo ? 'Excluindo...' : 'Excluir conta'),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                Positioned(
                  top: -10,
                  right: -6,
                  child: IconButton(
                    onPressed: () => Navigator.of(dialogContext).pop(),
                    icon: const Icon(
                      LucideIcons.x,
                      size: 18,
                      color: Solus.muted,
                    ),
                    tooltip: 'Fechar',
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

class _MenuTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _MenuTile({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: Solus.border)),
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: Solus.muted),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: const TextStyle(fontSize: 16))),
          ],
        ),
      ),
    );
  }
}
