import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models.dart';

/// Equivalente ao localStorage do frontend React (MESMAS chaves).
class Prefs {
  static SharedPreferences? _instance;

  static Future<SharedPreferences> get instance async =>
      _instance ??= await SharedPreferences.getInstance();

  static Future<String?> read(String key) async => (await instance).getString(key);
  static Future<void> write(String key, String value) async =>
      (await instance).setString(key, value);
  static Future<void> remove(String key) async => (await instance).remove(key);

  static Future<bool?> readBool(String key) async => (await instance).getBool(key);
  static Future<void> writeBool(String key, bool value) async =>
      (await instance).setBool(key, value);

  // Chaves exatas do React — não renomear.
  static const tokenKey = 'token';
  static const roleKey = 'role';
  static const chatKey = 'solus.chat.v2';
  static const creditsKey = 'solus.credits.v1';
  static const creditHistoryKey = 'solus.credit-history.v1';
  static const lotsKey = 'solus.materials.v1';
  static const notificationKey = 'solus.notificacoes.v1';
  static const companyIdKey = 'solus.company.id';
  static const demoColetaKey = 'solus.demo.coleta';

  static Future<List<ChatMessage>> chat() async {
    final raw = await read(chatKey);
    if (raw == null || raw.isEmpty) return <ChatMessage>[];
    try {
      final decoded = jsonDecode(raw) as List;
      return decoded.map(ChatMessage.fromJson).toList();
    } catch (_) {
      return <ChatMessage>[];
    }
  }

  static Future<void> saveChat(List<ChatMessage> messages) async =>
      write(chatKey, jsonEncode(messages.map((m) => m.toJson()).toList()));

  static Future<int> credits() async => int.tryParse(await read(creditsKey) ?? '') ?? 240;

  static Future<void> setCredits(int value) async => write(creditsKey, '$value');

  static Future<List<Json>> creditHistory() async {
    final raw = await read(creditHistoryKey);
    if (raw == null || raw.isEmpty) return <Json>[];
    try {
      final decoded = jsonDecode(raw) as List;
      return decoded.map(asMap).toList();
    } catch (_) {
      return <Json>[];
    }
  }

  static Future<void> saveCreditHistory(List<Json> items) async =>
      write(creditHistoryKey, jsonEncode(items));

  static Future<List<Json>> lots() async {
    final raw = await read(lotsKey);
    if (raw == null || raw.isEmpty) return <Json>[];
    try {
      final decoded = jsonDecode(raw) as List;
      return decoded.map(asMap).toList();
    } catch (_) {
      return <Json>[];
    }
  }

  static Future<void> saveLots(List<Json> lots) async =>
      write(lotsKey, jsonEncode(lots));

  static Future<Map<String, bool>> notifications() async {
    final raw = await read(notificationKey);
    if (raw == null || raw.isEmpty) return <String, bool>{};
    try {
      final decoded = jsonDecode(raw) as Map;
      return decoded.map((k, v) => MapEntry(k.toString(), v == true));
    } catch (_) {
      return <String, bool>{};
    }
  }

  static Future<void> saveNotifications(Map<String, bool> values) async =>
      write(notificationKey, jsonEncode(values));
}
