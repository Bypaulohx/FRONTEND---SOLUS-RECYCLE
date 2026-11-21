import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:solus_recycle/theme.dart';
import 'package:solus_recycle/utils/format.dart';

void main() {
  test('mascaras progressivas do React', () {
    expect(Masks.phone('11988888888'), '(11) 98888-8888');
    expect(Masks.cep('01214030'), '01214-030');
    expect(Masks.document('11222333000144'), '11.222.333/0001-44');
  });

  test('creditos em reais', () {
    expect(Masks.currency(240), 'R\$ 12,00');
  });

  test('tokens de tema', () {
    expect(Solus.green, const Color(0xFF38C958));
    expect(Solus.radius, 10.0);
  });
}
