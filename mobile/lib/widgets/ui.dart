import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../models.dart';
import '../providers/session.dart';
import '../services/external.dart';
import '../theme.dart';

/// Seta de voltar padrão — 30x30, sem hover/reação de "bola".
class SolusBackButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final String? route;

  const SolusBackButton({super.key, this.onPressed, this.route});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 30,
      height: 30,
      child: IconButton(
        onPressed: onPressed ?? () => Navigator.of(context).pop(),
        icon: const Icon(LucideIcons.arrowLeft, size: 24),
        color: Solus.ink,
        iconSize: 24,
        padding: EdgeInsets.zero,
        constraints: const BoxConstraints(),
        splashRadius: 1,
        highlightColor: Colors.transparent,
        hoverColor: Colors.transparent,
        tooltip: 'Voltar',
      ),
    );
  }
}

class SolusButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final bool outlined;
  final IconData? icon;
  final double? minWidth;

  const SolusButton(
    this.label, {
    super.key,
    this.onPressed,
    this.loading = false,
    this.outlined = false,
    this.icon,
    this.minWidth,
  });

  @override
  Widget build(BuildContext context) {
    final style = outlined
        ? OutlinedButton.styleFrom(
            foregroundColor: Solus.greenDark,
            side: const BorderSide(color: Solus.greenDark),
            minimumSize: Size(minWidth ?? double.infinity, 47),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Solus.radius)),
            textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
          )
        : ElevatedButton.styleFrom(
            backgroundColor: Solus.green,
            foregroundColor: Colors.white,
            disabledBackgroundColor: Solus.green.withValues(alpha: .7),
            minimumSize: Size(minWidth ?? double.infinity, 47),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Solus.radius)),
            textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          );

    final child = loading
        ? const SizedBox(
            height: 20,
            width: 20,
            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 8)],
              Text(label),
            ],
          );

    return SizedBox(
      width: minWidth,
      height: 47,
      child: outlined
          ? OutlinedButton(
              onPressed: loading ? null : onPressed,
              style: style,
              child: child,
            )
          : ElevatedButton(
              onPressed: loading ? null : onPressed,
              style: style,
              child: child,
            ),
    );
  }
}

class MiniButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final MiniButtonStyle variant;

  const MiniButton(
    this.label, {
    super.key,
    this.onPressed,
    this.icon,
    this.variant = MiniButtonStyle.primary,
  });

  @override
  Widget build(BuildContext context) {
    final (background, foreground, side) = switch (variant) {
      MiniButtonStyle.primary => (Solus.green, Colors.white, BorderSide.none),
      MiniButtonStyle.outline => (Colors.white, Solus.greenDark, const BorderSide(color: Solus.green)),
      MiniButtonStyle.ghost => (Colors.white, Solus.muted, const BorderSide(color: Solus.border)),
      MiniButtonStyle.danger => (Colors.white, Solus.danger, const BorderSide(color: Solus.danger)),
    };
    return SizedBox(
      height: 36,
      child: TextButton(
        onPressed: onPressed,
        style: TextButton.styleFrom(
          backgroundColor: background,
          foregroundColor: foreground,
          side: side,
          padding: const EdgeInsets.symmetric(horizontal: 13),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[Icon(icon, size: 14), const SizedBox(width: 6)],
            Text(label),
          ],
        ),
      ),
    );
  }
}

enum MiniButtonStyle { primary, outline, ghost, danger }

class PageTitle extends StatelessWidget {
  final String title;
  final String? eyebrow;
  final String? subtitle;
  final Widget? trailing;

  const PageTitle({
    super.key,
    required this.title,
    this.eyebrow,
    this.subtitle,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (eyebrow != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text(
                    eyebrow!.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: Solus.greenDark,
                      letterSpacing: .8,
                    ),
                  ),
                ),
              Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
              if (subtitle != null)
                Padding(
                  padding: const EdgeInsets.only(top: 5),
                  child: Text(subtitle!, style: const TextStyle(fontSize: 11, color: Solus.muted)),
                ),
            ],
          ),
        ),
        ?trailing,
      ],
    );
  }
}

class SectionTitle extends StatelessWidget {
  final String title;
  final Widget? action;
  final EdgeInsetsGeometry margin;

  const SectionTitle(this.title, {super.key, this.action, this.margin = const EdgeInsets.only(top: 22, bottom: 10)});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: margin,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          ?action,
        ],
      ),
    );
  }
}

class LinkAction extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final IconData? icon;

  const LinkAction(this.label, this.onTap, {super.key, this.icon});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[Icon(icon, size: 14, color: Solus.greenDark), const SizedBox(width: 4)],
          Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Solus.greenDark)),
        ],
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  final String message;
  final IconData? icon;
  final bool compact;

  const EmptyState(this.message, {super.key, this.icon, this.compact = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(compact ? 12 : 18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(Solus.radius),
        border: Border.all(color: Solus.border),
      ),
      child: Column(
        children: [
          if (icon != null) Icon(icon, size: 28, color: Solus.inactive),
          if (icon != null) const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 12, color: Solus.muted),
          ),
        ],
      ),
    );
  }
}

class LoadingView extends StatelessWidget {
  const LoadingView({super.key, this.label = 'Carregando...'});

  final String label;

  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: Solus.green),
            const SizedBox(height: 12),
            Text(label, style: const TextStyle(fontSize: 12, color: Solus.muted)),
          ],
        ),
      );
}

class ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ErrorView(this.message, {super.key, this.onRetry});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.circleAlert, size: 32, color: Solus.danger),
              const SizedBox(height: 12),
              Text(message, textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: Solus.muted)),
              if (onRetry != null) ...[
                const SizedBox(height: 12),
                MiniButton('Tentar novamente', onPressed: onRetry, variant: MiniButtonStyle.outline),
              ],
            ],
          ),
        ),
      );
}

class StatusPill extends StatelessWidget {
  final String label;
  final String status;

  const StatusPill(this.label, this.status, {super.key});

  @override
  Widget build(BuildContext context) {
    final (background, foreground) = switch (status) {
      'PENDENTE' => (const Color(0xFFFFF8E1), const Color(0xFF8A6D00)),
      'CANCELADO' => (const Color(0xFFFFF0F0), Solus.danger),
      _ => (Solus.greenSoft, Solus.greenDark),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(999)),
      child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: foreground)),
    );
  }
}

class Avatar extends StatelessWidget {
  final String? name;
  final double size;

  const Avatar(this.name, {super.key, this.size = 40});

  @override
  Widget build(BuildContext context) {
    final text = initials(name);
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(color: Solus.greenSoft, shape: BoxShape.circle),
      alignment: Alignment.center,
      child: Text(text, style: TextStyle(fontSize: size * .32, fontWeight: FontWeight.w700, color: Solus.greenDark)),
    );
  }
}

/// Header + bottom nav idênticos ao Layout do React.
class AppScaffold extends StatelessWidget {
  final Widget child;
  final String currentPath;
  final bool showNav;

  const AppScaffold({super.key, required this.child, required this.currentPath, this.showNav = true});

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();
    final home = session.isCompany ? '/dashboard-empresa' : '/home';
    return Scaffold(
      backgroundColor: Solus.surface,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(Solus.headerHeight),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: Solus.appWidth),
            child: Container(
              height: Solus.headerHeight,
              decoration: const BoxDecoration(
                color: Color(0xF5FFFFFF),
                border: Border(bottom: BorderSide(color: Solus.border)),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pushNamedAndRemoveUntil(home, (_) => false),
                    child: Image.asset(
                      'assets/images/solus-logo.png',
                      height: 26,
                      fit: BoxFit.contain,
                      errorBuilder: (_, _, _) => const Text(
                        'SOLUS RECYCLE',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Solus.greenDark),
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.of(context).pushNamed('/perfil'),
                    child: Avatar(session.me?.displayName ?? session.displayName),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      bottomNavigationBar: showNav
          ? Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: Solus.appWidth),
                child: Container(
                  decoration: const BoxDecoration(
                    color: Color(0xFAFFFFFF),
                    border: Border(top: BorderSide(color: Solus.border)),
                    boxShadow: [BoxShadow(color: Color(0x0A111827), blurRadius: 12, offset: Offset(0, -2))],
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                  child: SafeArea(
                    top: false,
                    child: SizedBox(
                      height: 52,
                      child: Row(
                        children: (session.isCompany
                                ? const ['/dashboard-empresa', '/mapa-empresa', '/conversas', '/materiais-empresa', '/agenda-empresa']
                                : const ['/home', '/mapa', '/conversas', '/recompensas', '/agendamento'])
                            .asMap()
                            .entries
                            .map((entry) => _navItem(context, session, entry.value, entry.key))
                            .toList(),
                      ),
                    ),
                  ),
                ),
              ),
            )
          : null,
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: Solus.appWidth),
          child: child,
        ),
      ),
    );
  }

  Widget _navItem(BuildContext context, Session session, String route, int index) {
    final company = session.isCompany;
    final icons = company
        ? const [LucideIcons.home, LucideIcons.mapPin, LucideIcons.messageCircle, LucideIcons.recycle, LucideIcons.calendarDays]
        : const [LucideIcons.home, LucideIcons.mapPin, LucideIcons.messageCircle, LucideIcons.recycle, LucideIcons.calendarDays];
    final labels = company
        ? const ['Início', 'Mapa', 'Conversas', 'Reciclagem', 'Agenda']
        : const ['Início', 'Mapa', 'Conversas', 'Reciclagem', 'Agenda'];

    bool active(String to) {
      if (route == to) return true;
      if (to == '/conversas') return currentPath.startsWith('/conversas');
      if (company && to == '/dashboard-empresa') return currentPath == '/home';
      if (company && to == '/agenda-empresa') {
        return currentPath == '/agendamento' || currentPath.startsWith('/escanear-qr');
      }
      if (!company && to == '/agendamento') {
        return currentPath.startsWith('/confirmacao-agendamento') ||
            currentPath == '/qr-code' ||
            currentPath.startsWith('/confirmacao-cancelamento');
      }
      if (!company && to == '/recompensas') return currentPath == '/reciclagem';
      return false;
    }

    final isActive = active(route);
    final color = isActive ? Solus.green : Solus.inactive;
    return Expanded(
      child: InkWell(
        onTap: () => Navigator.of(context).pushNamedAndRemoveUntil(route, (r) => r.settings.name == route),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icons[index], size: 23, color: color),
            const SizedBox(height: 4),
            Text(
              labels[index],
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                color: color,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

Future<bool> confirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  String confirmLabel = 'Confirmar',
  String cancelLabel = 'Cancelar',
  bool danger = false,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Solus.radius)),
      title: Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
      content: Text(message, style: const TextStyle(fontSize: 13, color: Solus.muted)),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: Text(cancelLabel, style: const TextStyle(color: Solus.muted)),
        ),
        TextButton(
          onPressed: () => Navigator.of(context).pop(true),
          child: Text(confirmLabel,
              style: TextStyle(color: danger ? Solus.danger : Solus.greenDark, fontWeight: FontWeight.w700)),
        ),
      ],
    ),
  );
  return result ?? false;
}

/// Abre o seletor de navegação com Google Maps / Waze / Apple Maps.
Future<void> openNavigation({
  required BuildContext context,
  double? latitude,
  double? longitude,
  String? endereco,
  String? label,
}) async {
  final hasCoords = latitude != null && longitude != null;
  final origin = await getCurrentPositionOrNull();
  final o = origin == null ? '' : '${origin.latitude},${origin.longitude}';
  final dest = hasCoords
      ? '$latitude,$longitude'
      : Uri.encodeComponent(endereco ?? 'Endereço da coleta');
  final encoded = Uri.encodeComponent(label ?? endereco ?? 'Ponto de coleta Solus Recycle');
  final urls = <String>[
    'https://www.google.com/maps/dir/?api=1${o.isEmpty ? '' : '&origin=$o'}&destination=$dest&travelmode=driving',
    'https://waze.com/ul?${hasCoords ? 'll=$dest' : 'q=$dest'}&navigate=yes',
    'https://maps.apple.com/?daddr=$dest&dirflg=d&q=$encoded',
  ];
  if (!context.mounted) return;
  showModalBottomSheet(
    context: context,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(Solus.radius)),
    ),
    builder: (context) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text('Abrir rota em', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          ),
          ...List.generate(urls.length, (index) {
            final names = ['Google Maps', 'Waze', 'Apple Maps'];
            final icons = [LucideIcons.map, LucideIcons.navigation, LucideIcons.mapPin];
            return ListTile(
              leading: Icon(icons[index], color: Solus.greenDark),
              title: Text(names[index]),
              onTap: () {
                Navigator.of(context).pop();
                launchExternal(urls[index]);
              },
            );
          }),
        ],
      ),
    ),
  );
}

/// Pílula de status com os rótulos exatos do React.
class AgendamentoStatusPill extends StatelessWidget {
  final Agendamento agendamento;

  const AgendamentoStatusPill(this.agendamento, {super.key});

  @override
  Widget build(BuildContext context) => StatusPill(agendamento.statusLabel, agendamento.status);
}

/// Implementações nativas em services/external.dart.
Future<({double latitude, double longitude})?> getCurrentPositionOrNull() =>
    External.currentPosition();

void launchExternal(String url) => External.open(url);
