import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/session.dart';
import 'theme.dart';
import 'screens/auth/auth_screens.dart';
import 'screens/user/user_screens.dart';
import 'screens/company/company_screens.dart';

/// Navegação equivalente ao App.tsx (mesmos nomes de rota/query params).
class SolusApp extends StatelessWidget {
  const SolusApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Solus Recycle',
      debugShowCheckedModeBanner: false,
      theme: Solus.theme,
      initialRoute: '/',
      onGenerateRoute: (settings) {
        final params = <String, String>{};
        if (settings.arguments is Map) {
          (settings.arguments as Map).forEach((k, v) => params[k.toString()] = v.toString());
        }
        Widget child;
        switch (settings.name) {
          case '/': child = const IndexScreen(); break;
          case '/login': child = const LoginScreen(); break;
          case '/oauth/callback': child = AuthCallbackScreen(params: params); break;
          case '/cadastro': child = const CadastroScreen(); break;
          case '/recuperacao': child = const RecuperacaoScreen(); break;
          case '/verificacao': child = VerificacaoScreen(params: params); break;
          case '/nova-senha': child = NovaSenhaScreen(params: params); break;
          case '/sucesso': child = const SucessoScreen(); break;

          case '/home': child = const HomeScreen(); break;
          case '/mapa': child = const MapaScreen(); break;
          case '/agendamento': child = const AgendamentoScreen(); break;
          case '/reciclagem': child = const ReciclagemScreen(); break;
          case '/encontrar-catadores': child = const MapaScreen(); break;
          case '/confirmacao-agendamento': child = ConfirmacaoAgendamentoScreen(params: params); break;
          case '/confirmacao-cancelamento': child = ConfirmacaoCancelamentoScreen(params: params); break;
          case '/detalhes-ponto': child = DetalhesPontoScreen(params: params); break;
          case '/perfil': child = const PerfilScreen(); break;
          case '/notificacoes': child = const NotificacoesScreen(); break;
          case '/meus-dados': child = const MeusDadosScreen(); break;
          case '/ajuda': child = const AjudaScreen(); break;
          case '/conversas': child = ConversasScreen(params: params); break;
          case '/recompensas': child = const RecompensasScreen(); break;
          case '/qr-code': child = const QrCodeUsuarioScreen(); break;

          case '/dashboard-empresa': child = const DashboardEmpresaScreen(); break;
          case '/mapa-empresa': child = const MapaEmpresaScreen(); break;
          case '/agenda-empresa': child = AgendaEmpresaScreen(params: params); break;
          case '/escanear-qr': child = EscanearQrScreen(params: params); break;
          case '/materiais-empresa': child = const MateriaisEmpresaScreen(); break;
          default: child = const IndexScreen();
        }

        return MaterialPageRoute(
          settings: settings,
          builder: (context) => _Guard(route: settings.name ?? '/', child: child),
        );
      },
    );
  }
}

/// PrivateRoute + RoleRoute + redirecionamentos por papel do App.tsx.
class _Guard extends StatelessWidget {
  final String route;
  final Widget child;

  const _Guard({required this.route, required this.child});

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();
    const publicRoutes = {
      '/', '/login', '/oauth/callback', '/cadastro', '/recuperacao',
      '/verificacao', '/nova-senha', '/sucesso',
    };
    if (publicRoutes.contains(route)) return child;
    if (!session.isLoggedIn) {
      return const LoginScreen();
    }

    final userRoutes = {
      '/recompensas', '/qr-code',
    };
    final companyRoutes = {
      '/dashboard-empresa', '/mapa-empresa', '/agenda-empresa',
      '/escanear-qr', '/materiais-empresa',
    };
    if (userRoutes.contains(route) && session.isCompany) return const DashboardEmpresaScreen();
    if (companyRoutes.contains(route) && session.isUser) return const HomeScreen();

    // aliases por papel
    if (route == '/home' && session.isCompany) return const DashboardEmpresaScreen();
    if (route == '/mapa' && session.isCompany) return const MapaEmpresaScreen();
    if (route == '/agendamento' && session.isCompany) {
      return const AgendaEmpresaScreen(params: <String, String>{});
    }
    if (route == '/reciclagem' && session.isCompany) return const MateriaisEmpresaScreen();
    if (route == '/dashboard-empresa' && session.isUser) return const HomeScreen();
    if (route == '/mapa-empresa' && session.isUser) return const MapaScreen();
    if (route == '/agenda-empresa' && session.isUser) return const AgendamentoScreen();
    if (route == '/materiais-empresa' && session.isUser) return const ReciclagemScreen();

    return child;
  }
}

/// Navega com query params no formato do React.
Future<T?> go<T extends Object?>(
  BuildContext context,
  String path, [
  Map<String, String>? params,
]) =>
    Navigator.of(context).pushNamed<T>(path, arguments: params ?? const <String, String>{});

Future<T?> replace<T extends Object?>(
  BuildContext context,
  String path, [
  Map<String, String>? params,
]) =>
    Navigator.of(context).pushReplacementNamed<T, Object>(path, arguments: params ?? const <String, String>{});

Future<T?> goHome<T extends Object?>(BuildContext context) =>
    Navigator.of(context).pushNamedAndRemoveUntil<T>('/home', (_) => false);

Map<String, String> paramsOf(BuildContext context) {
  final args = ModalRoute.of(context)?.settings.arguments;
  if (args is! Map) return <String, String>{};
  return args.map((k, v) => MapEntry(k.toString(), v.toString()));
}
