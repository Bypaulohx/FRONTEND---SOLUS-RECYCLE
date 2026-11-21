import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../services/storage.dart';
import '../../theme.dart';
import '../../widgets/ui.dart';

class NotificacoesScreen extends StatefulWidget {
  const NotificacoesScreen({super.key});

  @override
  State<NotificacoesScreen> createState() => _NotificacoesScreenState();
}

class _NotificacoesScreenState extends State<NotificacoesScreen> {
  static const Map<String, bool> _padrao = {
    'Coletas agendadas': true,
    'Lembretes de separação': true,
  };

  Map<String, bool> _preferencias = Map<String, bool>.from(_padrao);

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    final salvo = await Prefs.notifications();
    if (!mounted) return;
    setState(() {
      _preferencias = <String, bool>{..._padrao, ...salvo};
    });
    await Prefs.saveNotifications(_preferencias);
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      currentPath: '/notificacoes',
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: const [
                Icon(LucideIcons.bell, size: 30, color: Solus.green),
                SizedBox(width: 16),
                Text(
                  'Notificações',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                ),
              ],
            ),
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Text(
                'Configure como deseja receber notificações.',
                style: TextStyle(fontSize: 14, color: Solus.muted, height: 1.5),
              ),
            ),
            const SizedBox(height: 24),
            ..._preferencias.entries.map(
              (entry) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        entry.key,
                        style: const TextStyle(
                          fontSize: 15,
                          color: Solus.muted,
                        ),
                      ),
                    ),
                    Switch(
                      value: entry.value,
                      activeThumbColor: Solus.green,
                      onChanged: (value) async {
                        final proximo = Map<String, bool>.from(_preferencias);
                        proximo[entry.key] = value;
                        setState(() => _preferencias = proximo);
                        await Prefs.saveNotifications(proximo);
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
