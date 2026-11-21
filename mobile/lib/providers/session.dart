import 'package:flutter/foundation.dart';

import '../models.dart';
import '../services/api.dart';
import '../services/storage.dart';

/// Equivalente ao AuthContext do React, com as mesmas chaves de persistência.
class Session extends ChangeNotifier {
  String? token;
  String? role;
  Me? me;
  bool loading = true;
  String? recoveryEmail;

  bool get isLoggedIn => token != null && token!.isNotEmpty;
  bool get isCompany => role == 'COMPANY';
  bool get isUser => !isCompany;
  String get displayName => me?.displayName ?? 'Solus Recycle';

  Future<void> init() async {
    token = await Prefs.read('token');
    final storedRole = await Prefs.read('role');
    if (storedRole == 'USER' || storedRole == 'COMPANY') role = storedRole;
    ApiClient.token = token;
    await refreshUser();
  }

  Future<void> refreshUser() async {
    if (!isLoggedIn) {
      me = null;
      loading = false;
      notifyListeners();
      return;
    }
    loading = true;
    notifyListeners();
    final result = await ApiClient.me();
    if (result.ok) me = result.data;
    loading = false;
    notifyListeners();
  }

  Future<String?> login(String email, String password) async {
    final result = await ApiClient.login(email.trim(), password);
    if (result.error != null) return result.error;
    final data = result.data;
    if (data == null || data.jwtToken.isEmpty) return 'Não foi possível entrar.';
    await setToken(data.jwtToken, data.role);
    me = Me(
      id: data.id,
      email: email.trim(),
      nome: data.fullName.isNotEmpty ? data.fullName : data.firstName,
      telefone: data.telefone,
      cpf: data.cpf,
      cnpj: data.cnpj,
    );
    notifyListeners();
    await refreshUser();
    return null;
  }

  Future<void> loginWithToken(String jwt, String nextRole) async {
    await setToken(jwt, nextRole);
    await refreshUser();
  }

  Future<void> setToken(String? nextToken, [String? nextRole]) async {
    token = nextToken;
    if (nextRole != null) role = nextRole;
    ApiClient.token = token;
    if (nextToken == null || nextToken.isEmpty) {
      await Prefs.remove('token');
      await Prefs.remove('role');
      role = null;
    } else {
      await Prefs.write('token', nextToken);
      if (role != null) await Prefs.write('role', role!);
    }
    notifyListeners();
  }

  Future<void> logout() async {
    await ApiClient.logout();
    await setToken(null);
    me = null;
    notifyListeners();
  }

  Future<void> deleteAccount() async {
    await ApiClient.deleteAccount();
    await setToken(null);
    me = null;
    notifyListeners();
  }

  Future<void> updateMe(Me next) async {
    me = next;
    notifyListeners();
  }
}
