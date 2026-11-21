import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../models.dart';

/// Cliente HTTP para o backend FastAPI (mesma API usada pelo frontend React).
class ApiClient {
  static const String _defined = String.fromEnvironment('API_BASE');

  static String get baseUrl {
    if (_defined.isNotEmpty) return _defined;
    if (Platform.isAndroid) return 'http://10.0.2.2:8006/api';
    return 'http://localhost:8006/api';
  }

  static String? token;

  static Map<String, String> _headers({bool authenticated = true}) => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (authenticated && token != null && token!.isNotEmpty)
          'Authorization': 'Bearer $token',
      };

  static Future<ApiResult<T>> request<T>(
    String method,
    String path, {
    Object? body,
    bool authenticated = true,
    T Function(dynamic)? parser,
  }) async {
    final client = http.Client();
    try {
      final uri = Uri.parse('$baseUrl$path');
      final request = http.Request(method, uri)
        ..headers.addAll(_headers(authenticated: authenticated))
        ..body = body == null ? '' : jsonEncode(body);
      final streamed =
          await client.send(request).timeout(const Duration(seconds: 20));
      final res = await http.Response.fromStream(streamed);

      dynamic decoded;
      if (res.body.isNotEmpty) {
        try {
          decoded = jsonDecode(res.body);
        } catch (_) {
          decoded = res.body;
        }
      }

      if (res.statusCode >= 200 && res.statusCode < 300) {
        return ApiResult<T>(
          status: res.statusCode,
          data: parser == null ? decoded as T? : parser(decoded),
        );
      }

      String message = 'Erro ${res.statusCode}';
      if (decoded is Map) {
        final detail = decoded['detail'];
        message = (decoded['message'] ??
                (detail is String ? detail : null) ??
                decoded['error'] ??
                message)
            .toString();
      }
      return ApiResult<T>(status: res.statusCode, error: message);
    } catch (_) {
      return const ApiResult(status: 0, error: 'Falha de conexão. Tente novamente.');
    } finally {
      client.close();
    }
  }

  static Future<ApiResult<T>> get<T>(String path, T Function(dynamic) parser,
          {bool authenticated = true}) =>
      request<T>('GET', path, parser: parser, authenticated: authenticated);

  static Future<ApiResult<T>> post<T>(String path,
          {Object? body, T Function(dynamic)? parser, bool authenticated = true}) =>
      request<T>('POST', path,
          body: body, parser: parser, authenticated: authenticated);

  static Future<ApiResult<T>> put<T>(String path,
          {Object? body, T Function(dynamic)? parser, bool authenticated = true}) =>
      request<T>('PUT', path,
          body: body, parser: parser, authenticated: authenticated);

  static Future<ApiResult<T>> patch<T>(String path,
          {Object? body, T Function(dynamic)? parser, bool authenticated = true}) =>
      request<T>('PATCH', path,
          body: body, parser: parser, authenticated: authenticated);

  static Future<ApiResult<T>> delete<T>(String path,
          {T Function(dynamic)? parser, bool authenticated = true}) =>
      request<T>('DELETE', path, parser: parser, authenticated: authenticated);

  // ----------------------------- Autenticação -----------------------------
  static Future<ApiResult<LoginResponse>> login(String email, String password) =>
      post<LoginResponse>('/auth/login',
          body: {'email': email, 'password': password},
          parser: LoginResponse.fromJson);

  static Future<ApiResult<Me>> me() => get<Me>('/auth/me', Me.fromJson);

  static Future<ApiResult<dynamic>> logout() => post('/auth/logout');

  static Future<ApiResult<dynamic>> updatePhone(String phone) => put(
      '/profile/phone?newPhone=${Uri.encodeComponent(phone)}');

  static Future<ApiResult<dynamic>> updateAddress(Endereco endereco) =>
      put('/profile/address', body: endereco.toJson());

  static Future<ApiResult<dynamic>> deleteAccount() => delete('/profile/account');

  static Future<ApiResult<dynamic>> updateCompany(Map<String, dynamic> body) =>
      put('/profile/company', body: body);

  static Future<ApiResult<dynamic>> socialUrl(String provider, {String mode = 'login'}) =>
      get('/auth/social/$provider/url?mode=$mode', (v) => v, authenticated: false);

  static Future<ApiResult<LoginResponse>> socialDemo(String provider, {String? state}) => post(
        '/auth/social/$provider/demo${state != null ? '?state=${Uri.encodeComponent(state)}' : ''}',
        parser: LoginResponse.fromJson,
      );

  static Future<ApiResult<dynamic>> check(String field, String value) => get(
        '/auth/check/$field?value=${Uri.encodeComponent(value)}', (v) => v,
        authenticated: false);

  static Future<ApiResult<dynamic>> registerUser(Map<String, dynamic> body) =>
      post('/usuario', body: body, authenticated: false);

  static Future<ApiResult<dynamic>> registerCompany(Map<String, dynamic> body) =>
      post('/empresa', body: body, authenticated: false);

  static Future<ApiResult<dynamic>> verifyRegistration(String email, String code) => post(
        '/cadastro/verificar', body: {'email': email, 'code': code},
        authenticated: false);

  static Future<ApiResult<dynamic>> resendVerification(String email) => post(
        '/cadastro/reenviar?email=${Uri.encodeComponent(email)}',
        authenticated: false);

  static Future<ApiResult<dynamic>> initiateReset(String identifier, String principalType) =>
      post('/password-reset/initiate',
          body: {
            'identifier': identifier,
            'principalType': principalType,
            'deliveryMethod': 'email'
          },
          authenticated: false);

  static Future<ApiResult<dynamic>> verifyResetCode(String code, String principalType) => post(
        '/password-reset/verify-code-only',
        body: {'principalType': principalType, 'code': code},
        authenticated: false);

  static Future<ApiResult<dynamic>> resetPassword(
          String code, String principalType, String newPassword) =>
      post('/password-reset/verify-and-reset',
          body: {
            'principalType': principalType,
            'code': code,
            'newPassword': newPassword
          },
          authenticated: false);

  // ------------------------------- Domínio -------------------------------
  static Future<ApiResult<List<Empresa>>> empresas() =>
      get('/empresas', (v) => asList(v).map(Empresa.fromJson).toList());

  static Future<ApiResult<List<Agendamento>>> meusAgendamentos() => get(
        '/agendamentos/meus-agendamentos',
        (v) => asList(v).map(Agendamento.fromJson).toList());

  static Future<ApiResult<Agendamento>> criarAgendamento({
    required int companyId,
    required String tipoResiduo,
    required double pesoEstimado,
    required String scheduleTime,
  }) =>
      post('/agendamentos',
          body: {
            'companyId': companyId,
            'tipoResiduo': tipoResiduo,
            'pesoEstimado': pesoEstimado,
            'scheduleTime': scheduleTime,
          },
          parser: Agendamento.fromJson);

  static Future<ApiResult<List<PontoColeta>>> pontos() =>
      get('/pontos-coleta', (v) => asList(v).map(PontoColeta.fromJson).toList());

  static Future<ApiResult<Cep>> cep(String value) => get(
        '/cep/${value.replaceAll(RegExp(r'\D'), '')}', Cep.fromJson);

  static Future<ApiResult<PontoColeta>> criarPonto(Map<String, dynamic> body) =>
      post('/pontos-coleta', body: body, parser: PontoColeta.fromJson);

  static Future<ApiResult<List<PontoColeta>>> pontosProximos(
          double lat, double lon, {double raio = 5}) =>
      get('/pontos-coleta/proximos-coord?lat=$lat&lon=$lon&raio=$raio',
          (v) => asList(v).map(PontoColeta.fromJson).toList());

  static Future<ApiResult<List<Agendamento>>> agendamentosDaEmpresa(int companyId,
          {String? status}) =>
      get('/agendamentos/company/$companyId${status != null ? '?status=${Uri.encodeComponent(status)}' : ''}',
          (v) => asList(v).map(Agendamento.fromJson).toList());

  static Future<ApiResult<Agendamento>> confirmarAgendamento(int id) =>
      put('/agendamentos/$id/confirmar', parser: Agendamento.fromJson);

  static Future<ApiResult<Agendamento>> recusarAgendamento(int id) =>
      put('/agendamentos/$id/recusar', parser: Agendamento.fromJson);

  static Future<ApiResult<Agendamento>> cancelarAgendamento(int id) =>
      put('/agendamentos/$id/cancelar', parser: Agendamento.fromJson);

  static Future<ApiResult<Agendamento>> concluirAgendamento(int id) =>
      put('/agendamentos/$id/concluir', parser: Agendamento.fromJson);

  static Future<ApiResult<PontoColeta>> atualizarPonto(int id, Map<String, dynamic> body) =>
      put('/pontos-coleta/$id', body: body, parser: PontoColeta.fromJson);

  static Future<ApiResult<List<PontoColeta>>> search(String q) => get(
        '/search?q=${Uri.encodeComponent(q)}',
        (v) => asList(v).map(PontoColeta.fromJson).toList());

  static Future<ApiResult<List<Feriado>>> feriados({int? ano, String? uf, String? municipio}) {
    final query = <String>[
      if (ano != null) 'ano=$ano',
      if (uf != null && uf.isNotEmpty) 'uf=${Uri.encodeComponent(uf)}',
      if (municipio != null && municipio.isNotEmpty)
        'municipio=${Uri.encodeComponent(municipio)}',
    ];
    return get('/feriados${query.isNotEmpty ? '?${query.join('&')}' : ''}',
        (v) => asList(v).map(Feriado.fromJson).toList());
  }
}

class ApiResult<T> {
  final T? data;
  final String? error;
  final int status;

  const ApiResult({this.data, this.error, this.status = 200});

  bool get ok => error == null && data != null;
  bool get isConnectionError => status == 0;
}
