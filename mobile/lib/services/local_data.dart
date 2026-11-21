import 'package:intl/intl.dart';

import '../models.dart';
import '../utils/format.dart';
import 'storage.dart';

/// Equivalente a frontend/src/utils/operations.ts.
/// Chat, créditos e lotes ainda não têm contrato no backend — ficam locais.
class LocalData {
  static const nivelPrata = 300;

  static final List<Json> seedCreditHistory = [
    {'id': 1042, 'points': 40, 'material': 'Papel', 'date': '12/11'},
    {'id': 1038, 'points': 25, 'material': 'Vidro', 'date': '04/11'},
  ];

  static final List<Json> seedLots = [
    {
      'id': 'L-2401',
      'material': 'Papel e plástico',
      'weightKg': 38.4,
      'origin': 'Cooperativa Vitória',
      'date': '18/11',
      'destination': 'Recicladora Solar',
    },
    {
      'id': 'L-2398',
      'material': 'Vidro',
      'weightKg': 22.7,
      'origin': 'Ponto Verde',
      'date': '16/11',
      'destination': 'Vetro Reciclagem',
    },
  ];

  static List<ChatMessage> seedChat = [
    ChatMessage(
      id: 'seed-1',
      coletaId: '1042',
      text: 'Bom dia! Deixei os materiais na portaria.',
      author: 'USER',
      from: 'me',
      time: '10:58',
      at: DateTime(2026, 11, 12, 10, 58),
    ),
    ChatMessage(
      id: 'seed-2',
      coletaId: '1042',
      text: 'Ótimo, obrigado! Vou confirmar o recebimento pelo QR.',
      author: 'COMPANY',
      from: 'them',
      time: '11:01',
      at: DateTime(2026, 11, 12, 11, 1),
    ),
    ChatMessage(
      id: 'seed-3',
      coletaId: '1042',
      text: 'Posso retirar até as 12h? Obrigada!',
      author: 'USER',
      from: 'me',
      time: '11:04',
      at: DateTime(2026, 11, 12, 11, 4),
    ),
  ];

  // ------------------------------- Créditos -------------------------------

  static Future<int> credits() => Prefs.credits();

  static Future<void> setCredits(int value) => Prefs.setCredits(value);

  static String creditInReais(num points) => Masks.currency(points);

  static Future<List<Json>> creditHistory() async {
    final saved = await Prefs.creditHistory();
    return saved.isEmpty ? seedCreditHistory : saved;
  }

  static Future<void> addCollectionCredit(int points, String material, int id) async {
    final current = await credits();
    await setCredits(current + points);
    final history = await creditHistory();
    history.removeWhere((item) => intOf(item['id']) == id);
    history.insert(0, {
      'id': id,
      'points': points,
      'material': material,
      'date': ddmmNow(),
    });
    await Prefs.saveCreditHistory(history);
  }

  // -------------------------------- Lotes ---------------------------------

  static Future<List<Json>> lots() async {
    final saved = await Prefs.lots();
    return saved.isEmpty ? seedLots : saved;
  }

  static Future<void> addMaterialLot(Json lot) async {
    final itens = await lots();
    itens.insert(0, lot);
    await Prefs.saveLots(itens);
  }

  // --------------------------------- Chat ---------------------------------

  static Future<List<ChatMessage>> messages(String coletaId) async {
    final all = await Prefs.chat();
    if (all.isEmpty) {
      return coletaId == '1042'
          ? seedChat.where((m) => m.coletaId == coletaId).toList()
          : <ChatMessage>[];
    }
    return all.where((m) => m.coletaId == coletaId).toList();
  }

  static Future<void> sendMessage(String coletaId, String text, String author) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return;
    final all = await Prefs.chat();
    final list = all.isEmpty ? List<ChatMessage>.from(seedChat) : all;
    final now = DateTime.now();
    list.add(ChatMessage(
      id: now.microsecondsSinceEpoch.toString(),
      coletaId: coletaId,
      text: trimmed,
      author: author,
      from: 'me',
      time: DateFormat('HH:mm', 'pt_BR').format(now),
      at: now,
    ));
    await Prefs.saveChat(list);
  }
}
