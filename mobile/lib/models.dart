/// DTOs espelhando frontend/src/api/client.ts e backend/app/schemas.py.
library;

typedef Json = Map<String, dynamic>;

Json asMap(dynamic value) => value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{};

List<Json> asList(dynamic value) => value is List
    ? value.map((e) => asMap(e)).toList()
    : <Json>[];

String? str(dynamic value) => value?.toString();
num? numOf(dynamic value) => value is num ? value : num.tryParse(value?.toString() ?? '');
double? doubleOf(dynamic value) {
  final n = numOf(value);
  return n?.toDouble();
}
int? intOf(dynamic value) {
  final n = numOf(value);
  return n?.toInt();
}
bool? boolOf(dynamic value) {
  if (value is bool) return value;
  if (value is String) return value.toLowerCase() == 'true' || value == '1';
  if (value is num) return value == 1;
  return null;
}
List<String> stringList(dynamic value) {
  if (value is List) return value.map((e) => e.toString()).toList();
  if (value is String && value.isNotEmpty) {
    return value.split(RegExp(r'[,;\n]')).map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
  }
  return <String>[];
}

class Endereco {
  final String? cep;
  final String? rua;
  final String? numero;
  final String? complemento;
  final String? bairro;
  final String? cidade;
  final String? estado;
  final double? latitude;
  final double? longitude;

  const Endereco({
    this.cep, this.rua, this.numero, this.complemento, this.bairro,
    this.cidade, this.estado, this.latitude, this.longitude,
  });

  factory Endereco.fromJson(dynamic value) {
    final j = asMap(value);
    return Endereco(
      cep: str(j['cep']), rua: str(j['rua']), numero: str(j['numero']),
      complemento: str(j['complemento']), bairro: str(j['bairro']),
      cidade: str(j['cidade']), estado: str(j['estado']),
      latitude: doubleOf(j['latitude']), longitude: doubleOf(j['longitude']),
    );
  }

  Map<String, dynamic> toJson() => {
        'cep': cep, 'rua': rua, 'numero': numero, 'complemento': complemento,
        'bairro': bairro, 'cidade': cidade, 'estado': estado,
        'latitude': latitude, 'longitude': longitude,
      };

  String get resumido {
    final parts = <String>[
      if (rua != null && rua!.isNotEmpty) rua!,
      if (numero != null && numero!.isNotEmpty) 'nº $numero',
      if (bairro != null && bairro!.isNotEmpty) bairro!,
      if (cidade != null && cidade!.isNotEmpty) cidade!,
      if (estado != null && estado!.isNotEmpty) estado!,
      if (cep != null && cep!.isNotEmpty) 'CEP $cep',
    ];
    return parts.join(' · ');
  }
}

class Me {
  final int id;
  final String email;
  final String? nome;
  final String? nomeFantasia;
  final String? razaoSocial;
  final String? telefone;
  final String? cpf;
  final String? cnpj;
  final Endereco? endereco;
  final String? profilePicture;
  final String? descricao;
  final String? tipoResiduo;
  final bool? fazColetaDomicilio;
  final String? materiaisColeta;
  final double? pesoMinimoKg;
  final double? pesoMaximoKg;
  final String? diasFuncionamento;
  final String? feriados;
  final String? imagemLocal;

  const Me({
    required this.id, required this.email, this.nome, this.nomeFantasia,
    this.razaoSocial, this.telefone, this.cpf, this.cnpj, this.endereco,
    this.profilePicture, this.descricao, this.tipoResiduo,
    this.fazColetaDomicilio, this.materiaisColeta, this.pesoMinimoKg,
    this.pesoMaximoKg, this.diasFuncionamento, this.feriados, this.imagemLocal,
  });

  factory Me.fromJson(dynamic value) {
    final j = asMap(value);
    return Me(
      id: intOf(j['id']) ?? 0,
      email: str(j['email']) ?? '',
      nome: str(j['nome']),
      nomeFantasia: str(j['nomeFantasia']),
      razaoSocial: str(j['razaoSocial']),
      telefone: str(j['telefone']),
      cpf: str(j['cpf']),
      cnpj: str(j['cnpj']),
      endereco: j['endereco'] == null ? null : Endereco.fromJson(j['endereco']),
      profilePicture: str(j['profilePicture']),
      descricao: str(j['descricao']),
      tipoResiduo: str(j['tipoResiduo']),
      fazColetaDomicilio: boolOf(j['fazColetaDomicilio']),
      materiaisColeta: str(j['materiaisColeta']),
      pesoMinimoKg: doubleOf(j['pesoMinimoKg']),
      pesoMaximoKg: doubleOf(j['pesoMaximoKg']),
      diasFuncionamento: str(j['diasFuncionamento']),
      feriados: str(j['feriados']),
      imagemLocal: str(j['imagemLocal']),
    );
  }

  String get displayName => nomeFantasia ?? nome ?? razaoSocial ?? email;

  Me copyWith({
    String? nome, String? nomeFantasia, String? razaoSocial, String? telefone, Endereco? endereco,
    String? descricao, String? tipoResiduo, bool? fazColetaDomicilio,
    String? materiaisColeta, double? pesoMinimoKg, double? pesoMaximoKg,
    String? diasFuncionamento, String? feriados, String? imagemLocal,
  }) => Me(
        id: id, email: email, nome: nome ?? this.nome,
        nomeFantasia: nomeFantasia ?? this.nomeFantasia,
        razaoSocial: razaoSocial ?? this.razaoSocial, telefone: telefone ?? this.telefone,
        cpf: cpf, cnpj: cnpj, endereco: endereco ?? this.endereco,
        profilePicture: profilePicture, descricao: descricao ?? this.descricao,
        tipoResiduo: tipoResiduo ?? this.tipoResiduo,
        fazColetaDomicilio: fazColetaDomicilio ?? this.fazColetaDomicilio,
        materiaisColeta: materiaisColeta ?? this.materiaisColeta,
        pesoMinimoKg: pesoMinimoKg ?? this.pesoMinimoKg,
        pesoMaximoKg: pesoMaximoKg ?? this.pesoMaximoKg,
        diasFuncionamento: diasFuncionamento ?? this.diasFuncionamento,
        feriados: feriados ?? this.feriados,
        imagemLocal: imagemLocal ?? this.imagemLocal,
      );
}

class LoginResponse {
  final String type;
  final String jwtToken;
  final String message;
  final String role;
  final int id;
  final String firstName;
  final String fullName;
  final String? telefone;
  final String? cpf;
  final String? cnpj;

  const LoginResponse({
    required this.type, required this.jwtToken, required this.message,
    required this.role, required this.id, required this.firstName,
    required this.fullName, this.telefone, this.cpf, this.cnpj,
  });

  factory LoginResponse.fromJson(dynamic value) {
    final j = asMap(value);
    return LoginResponse(
      type: str(j['type']) ?? 'Bearer',
      jwtToken: str(j['jwtToken']) ?? '',
      message: str(j['message']) ?? '',
      role: str(j['role']) ?? 'USER',
      id: intOf(j['id']) ?? 0,
      firstName: str(j['firstName']) ?? '',
      fullName: str(j['fullName']) ?? '',
      telefone: str(j['telefone']), cpf: str(j['cpf']), cnpj: str(j['cnpj']),
    );
  }
}

class Empresa {
  final int id;
  final String? nomeFantasia;
  final String? razaoSocial;
  final String? tipoResiduo;
  final String? cep;
  final String? profilePicture;

  const Empresa({
    required this.id, this.nomeFantasia, this.razaoSocial, this.tipoResiduo,
    this.cep, this.profilePicture,
  });

  factory Empresa.fromJson(dynamic value) {
    final j = asMap(value);
    return Empresa(
      id: intOf(j['id']) ?? 0,
      nomeFantasia: str(j['nomeFantasia']),
      razaoSocial: str(j['razaoSocial']),
      tipoResiduo: str(j['tipoResiduo']),
      cep: str(j['cep']),
      profilePicture: str(j['profilePicture']),
    );
  }

  String get nome => nomeFantasia ?? razaoSocial ?? 'Empresa #$id';
}

class Funcionamento {
  final int? id;
  final String? diaSemana;
  final String? horarioAbertura;
  final String? horarioFechamento;

  const Funcionamento({this.id, this.diaSemana, this.horarioAbertura, this.horarioFechamento});

  factory Funcionamento.fromJson(dynamic value) {
    final j = asMap(value);
    return Funcionamento(
      id: intOf(j['id']), diaSemana: str(j['diaSemana']),
      horarioAbertura: str(j['horarioAbertura']),
      horarioFechamento: str(j['horarioFechamento']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id, 'diaSemana': diaSemana,
        'horarioAbertura': horarioAbertura, 'horarioFechamento': horarioFechamento,
      };
}

class PontoColeta {
  final int id;
  final String? nome;
  final String? tipoResiduo;
  final String? endereco;
  final double latitude;
  final double longitude;
  final int? companyId;
  final String? companyNome;
  final double? distancia;
  final List<Funcionamento> funcionamento;
  final String? complemento;
  final double? raioKm;
  final List<String> materiais;
  final double? pesoMinimoKg;
  final double? pesoMaximoKg;
  final bool? recebeMateriais;
  final bool? coletaDomicilio;
  final String? telefone;
  final String? imagemUrl;

  const PontoColeta({
    required this.id, this.nome, this.tipoResiduo, this.endereco,
    required this.latitude, required this.longitude, this.companyId,
    this.companyNome, this.distancia, this.funcionamento = const [],
    this.complemento, this.raioKm, this.materiais = const [],
    this.pesoMinimoKg, this.pesoMaximoKg, this.recebeMateriais,
    this.coletaDomicilio, this.telefone, this.imagemUrl,
  });

  factory PontoColeta.fromJson(dynamic value) {
    final j = asMap(value);
    return PontoColeta(
      id: intOf(j['id']) ?? 0,
      nome: str(j['nome']), tipoResiduo: str(j['tipoResiduo']),
      endereco: str(j['endereco']),
      latitude: doubleOf(j['latitude']) ?? 0,
      longitude: doubleOf(j['longitude']) ?? 0,
      companyId: intOf(j['companyId']), companyNome: str(j['companyNome']),
      distancia: doubleOf(j['distancia']),
      funcionamento: asList(j['funcionamento']).map(Funcionamento.fromJson).toList(),
      complemento: str(j['complemento']), raioKm: doubleOf(j['raioKm']),
      materiais: stringList(j['materiais']),
      pesoMinimoKg: doubleOf(j['pesoMinimoKg']),
      pesoMaximoKg: doubleOf(j['pesoMaximoKg']),
      recebeMateriais: boolOf(j['recebeMateriais']),
      coletaDomicilio: boolOf(j['coletaDomicilio']),
      telefone: str(j['telefone']), imagemUrl: str(j['imagemUrl']),
    );
  }

  String get titulo => nome ?? tipoResiduo ?? 'Ponto de coleta';
}

class Agendamento {
  final int id;
  final String? userName;
  final String? userTelefone;
  final String? userEndereco;
  final String? tipoResiduo;
  final String? companyNomeFantasia;
  final String? companyTelefone;
  final String scheduleTime;
  final String status;
  final double? pesoEstimado;

  const Agendamento({
    required this.id, this.userName, this.userTelefone, this.userEndereco,
    this.tipoResiduo, this.companyNomeFantasia, this.companyTelefone,
    required this.scheduleTime, required this.status, this.pesoEstimado,
  });

  factory Agendamento.fromJson(dynamic value) {
    final j = asMap(value);
    return Agendamento(
      id: intOf(j['id']) ?? 0,
      userName: str(j['userName']), userTelefone: str(j['userTelefone']),
      userEndereco: str(j['userEndereco']), tipoResiduo: str(j['tipoResiduo']),
      companyNomeFantasia: str(j['companyNomeFantasia']),
      companyTelefone: str(j['companyTelefone']),
      scheduleTime: str(j['scheduleTime']) ?? '',
      status: str(j['status']) ?? 'PENDENTE',
      pesoEstimado: doubleOf(j['pesoEstimado']),
    );
  }

  bool get pendente => status == 'PENDENTE';
  bool get confirmado => status == 'CONFIRMADO';
  bool get cancelado => status == 'CANCELADO';
  bool get concluido => status == 'CONCLUIDO';

  /// Rótulos exatos do StatusPill do React.
  String get statusLabel => switch (status) {
        'PENDENTE' => 'Aguardando decisão',
        'CONFIRMADO' => 'Agendada',
        'CANCELADO' => 'Cancelada',
        'CONCLUIDO' => 'Concluída',
        _ => 'Aguardando decisão',
      };
}

class Cep {
  final String cep;
  final String? rua;
  final String? bairro;
  final String? cidade;
  final String? estado;
  final double? latitude;
  final double? longitude;

  const Cep({
    required this.cep, this.rua, this.bairro, this.cidade, this.estado,
    this.latitude, this.longitude,
  });

  factory Cep.fromJson(dynamic value) {
    final j = asMap(value);
    return Cep(
      cep: str(j['cep']) ?? '', rua: str(j['rua']), bairro: str(j['bairro']),
      cidade: str(j['cidade']), estado: str(j['estado']),
      latitude: doubleOf(j['latitude']), longitude: doubleOf(j['longitude']),
    );
  }
}

class Feriado {
  final String data;
  final String? motivo;
  final String? tipo;

  const Feriado({required this.data, this.motivo, this.tipo});

  factory Feriado.fromJson(dynamic value) {
    final j = asMap(value);
    return Feriado(
      data: str(j['data']) ?? str(j['date']) ?? '',
      motivo: str(j['motivo']) ?? str(j['name']) ?? str(j['nome']),
      tipo: str(j['tipo']),
    );
  }

  Map<String, dynamic> toJson() => {'data': data, 'motivo': motivo, 'tipo': tipo};
}

class ChatMessage {
  final String id;
  final String text;
  final String author;
  final DateTime at;
  final String? peerName;
  final String? coletaId;
  final String? time;

  /// Mensagens legadas do React usavam `from` em vez de `author`.
  final String? from;

  const ChatMessage({
    required this.id, required this.text, required this.author,
    required this.at, this.peerName, this.coletaId, this.time, this.from,
  });

  Map<String, dynamic> toJson() => {
        'id': id, 'text': text, 'author': author,
        'at': at.toIso8601String(), 'peerName': peerName,
        'coletaId': coletaId, 'time': time, 'from': from,
      };

  factory ChatMessage.fromJson(dynamic value) {
    final j = asMap(value);
    return ChatMessage(
      id: str(j['id']) ?? DateTime.now().microsecondsSinceEpoch.toString(),
      text: str(j['text']) ?? '',
      author: str(j['author']) ?? '',
      at: DateTime.tryParse(str(j['at']) ?? '') ?? DateTime.now(),
      peerName: str(j['peerName']),
      coletaId: str(j['coletaId']),
      time: str(j['time']),
      from: str(j['from']),
    );
  }

  bool isMine(String role) =>
      author.isEmpty ? from == 'me' : author == role;

  String get displayTime => time ?? fmtTimeFromDate(at);
}

String fmtTimeFromDate(DateTime value) =>
    '${value.hour.toString().padLeft(2, '0')}:${value.minute.toString().padLeft(2, '0')}';
