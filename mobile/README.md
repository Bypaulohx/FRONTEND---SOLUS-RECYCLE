# Solus Recycle — App Flutter (Android + iOS)

Novo frontend do Solus Recycle, migrado do React em `frontend/`. O backend FastAPI continua inalterado na porta padrão de desenvolvimento **8006**.

## Estrutura

- `lib/app.dart` — rotas nomeadas que espelham `frontend/src/App.tsx` ( guards por papel incluídos ).
- `lib/theme.dart` — design system (paleta, Montserrat, raios, alturas).
- `lib/models.dart` — DTOs equivalentes a `frontend/src/api/client.ts`.
- `lib/services/api.dart` — todos os endpoints da API 8006.
- `lib/services/storage.dart` — equivalente ao `localStorage` do React (mesmas chaves).
- `lib/services/local_data.dart` — chat, créditos e lotes (ainda sem contrato no backend).
- `lib/providers/session.dart` — sessão JWT com `provider`.
- `lib/widgets/ui.dart` — header, bottom nav de 5 abas, botões, cards, modais.
- `lib/screens/` — 28 telas divididas em `auth/`, `user/` e `company/`.
- `assets/images/` — logos, botões sociais e imagens de referência.

## Executando

```bash
cd mobile
flutter pub get
flutter run
```

### Backend em dispositivo físico

Por padrão o emulador Android usa `http://10.0.2.2:8006/api` e o simulador iOS usa `http://localhost:8006/api`. Em um dispositivo físico, informe o IP da máquina que roda o backend:

```bash
flutter run --dart-define=API_BASE=http://192.168.1.10:8006/api
```

### Credenciais de demonstração

- Usuário: `demo.usuario@solusrecycle.app` / `Solus@2026`
- Empresa: `demo.organizacao@solusrecycle.app` / `Solus@2026`
- Logins sociais demo: `demo.google@`, `demo.facebook@`, `demo.apple@solusrecycle.app` (via `/api/auth/social/{provider}/demo`)

## Build

```bash
flutter build apk --release
# iOS (somente em macOS)
flutter build ios --release
```

Se o Android solicitar licenças:

```bash
flutter doctor --android-licenses
```

## Notas de fidelidade

- Referência visual: 390×844, largura máxima 430 px, header 64 px, bottom nav fixa com 5 abas.
- Ícones `lucide_icons_flutter`; sem emojis, Bootstrap Icons ou setas manuais.
- Fluxos preservados: state/PKCE social com fallback demo, jornada usuário→empresa via coleta, mapa com filtros 5/40 km, agendamento com confirmação, QR do usuário lido pela empresa, chat WhatsApp-like, Buscar com mensagem automática, feriados via BrasilAPI.
- O React permanece no repositório como referência histórica; este diretório é o novo frontend.
