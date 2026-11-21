# Solus Recycle — Refatoração frontend e backend

Este documento descreve a refatoração do projeto para **Solus Recycle**: frontend em **React + Vite + TypeScript** com identidade visual baseada nos mockups da apresentação, e backend em **Python + FastAPI**, portado do repositório Java `SolusRecycle/backend`.

## Estrutura do projeto

- **`frontend/`** — aplicação React (Vite) + TypeScript, ícones `lucide-react` e design system Solus Recycle.
- **`backend/`** — API REST FastAPI + SQLAlchemy/SQLite, JWT HS256 e Argon2id.
- **`Solus Recycle/`** — apresentação, logos e imagens de referência usadas no redesenho.
- A pasta `frontend/public/` contém os assets servidos pelo Vite (`brand/`, `residuos/`, `assets/`).

## Como rodar

### 1. Backend (Python)

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate        # Windows
# source .venv/bin/activate     # Linux/macOS
pip install -r requirements.txt
cp .env.example .env            # opcional
uvicorn app.main:app --reload --port 8006
```

- Documentação interativa: `http://localhost:8006/docs`
- Health check: `http://localhost:8006/health` (retorna `UP`)
- Banco SQLite padrão: `backend/data/solus.db` (criado automaticamente)

Variáveis de ambiente principais (veja `backend/.env.example`): `DB_URL`, `JWT_SECRET`, `JWT_EXPIRATION`, `CORS_ORIGINS`, `FRONTEND_URL`, `SOCIAL_REDIRECT_URI`, credenciais OAuth (`GOOGLE_*`, `FACEBOOK_*`, `APPLE_*`) e as opcionais de Brevo, CepAberto e Supabase. `SEED_DEMO_DATA=true` (padrão) cria uma organização demonstrativa com três pontos em São Paulo em bancos SQLite locais — use `false` para desativar. Sem credenciais, as integrações operam em modo local: e-mails são logados no console, uploads ficam em `backend/data/uploads`, CEPs vêm do ViaCEP e coordenadas do Nominatim (o `CEPABERTO_TOKEN` apenas substitui o geocodificador).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev       # app em http://localhost:5173
```

O Vite faz proxy de `/api` para `http://localhost:8006` sem reescrever o caminho, porque as rotas do FastAPI já começam com `/api`. Para apontar para outro destino, defina `VITE_API_URL` (no cliente) ou `VITE_BACKEND_URL` (no proxy de desenvolvimento).

### 3. Testes

```bash
# Backend
cd backend && .\.venv\Scripts\python.exe -m pytest -q

# Frontend
cd frontend && npm run build
```

## Contas demo para testar os dois papéis

Com `SEED_DEMO_DATA=true` (padrão), o backend cria estas contas automaticamente:

| Papel | E-mail | Senha | Como entrar |
| --- | --- | --- | --- |
| Usuário (comunidade) | `demo.usuario@solusrecycle.app` | `Solus@2026` | Login com e-mail/senha |
| Empresa/ONG | `demo.organizacao@solusrecycle.app` | `Solus@2026` | Login com e-mail/senha |

Os botões sociais também funcionam sem credenciais OAuth: geram `demo.apple@solusrecycle.app`, `demo.facebook@solusrecycle.app` e `demo.google@solusrecycle.app`, com JWT real.

Para testar as duas pontas ao mesmo tempo, use uma aba para a empresa e uma janela anônima para o usuário: o papel e o token ficam em `localStorage`.

### Roteiro rápido

1. Usuário entra no mapa, escolhe um ponto e agenda uma coleta.
2. Empresa abre `/dashboard-empresa`, decide **Receber** (ou **Buscar** / **Recusar**).
3. Usuário abre `/confirmacao-agendamento` e clica em **Mostrar QR**.
4. Empresa abre `/escanear-qr`, lê o QR pela câmera (ou digita o código manualmente), informa peso e confirma.
5. Usuário verifica os pontos em `/recompensas`; empresa vê o lote em `/materiais-empresa`.
6. Em qualquer momento, os dois podem conversar em `/conversas?coleta={id}`.

## Contratos e regras preservadas do backend Java

- Autenticação com `password` (não `senha`) e resposta com `jwtToken`, `role`, `firstName`, `fullName`.
- Cadastro separado em `/api/usuario` e `/api/empresa`, com verificação por código em `/api/cadastro/verificar` e reenvio em `/api/cadastro/reenviar`.
- Recuperação de senha em `/api/password-reset/*` (initiate, verify-code-only, verify-and-reset).
- Blacklist de tokens em `/api/auth/logout`; `/api/auth/me` expõe os dados do principal autenticado.
- Agendamentos, empresas, pontos de coleta, disponibilidade, perfil, busca e upload de foto seguem os mesmos caminhos do Java.
- Fluxo de coleta: `GET /api/agendamentos/meus-agendamentos`, `GET /api/agendamentos/company/{id}`, `PUT /api/agendamentos/{id}/confirmar`, `/recusar`, `/cancelar` e `/concluir`, além de `PUT /api/pontos-coleta/{id}` para editar, por ponto, localização, raio, materiais, faixa de peso, complemento e horários. `PUT /api/profile/company` salva os dados operacionais da organização e `GET /api/feriados` consulta a BrasilAPI.
- `MessageResponse.url` pode ser `null`; `/health` responde texto puro `UP`.
- Hash de senha Argon2id (com compatibilidade para hashes bcrypt antigos).

## Frontend — identidade e navegação

- Paleta: verde `#38C958`, verde escuro `#149C68`, texto `#313131`, borda `#F1F1F1`, inativo `#ADADAD`, perigo `#FE3C3C`.
- Tipografia Montserrat; canvas mobile de referência 390×844; botões com 47–49px de altura e cards com raio de 10px.
- Bottom nav fixa com cinco abas por papel. Para usuários: `Início`, `Mapa`, `Conversas`, `Reciclagem` (créditos), `Agenda`. Para organizações: `Início` (painel), `Mapa`, `Conversas`, `Reciclagem` (materiais), `Agenda`. A antiga Busca foi unificada ao Mapa; no lugar dela entrou o chat contextual por coleta.
- Todos os ícones de interface foram migrados para `lucide-react`; não há mais Bootstrap Icons, emojis ou SVGs de interface inline.
- Login e cadastro têm olho para mostrar/ocultar senha e botões grandes das redes Apple, Facebook e Google.
- O cadastro começa escolhendo entre `Comunidade` e `Organizações Sociais`; CPF ou CNPJ são aceitos nos dois fluxos e formatados automaticamente. Não há mais radio de tipo de documento.
- Endereço é preenchido via ViaCEP (incluindo rua); organizações informam nome fantasia, razão social, complemento, coleta em domicílio, materiais recebidos e faixa de peso por coleta.
- O mapa usa Leaflet/OpenStreetMap com marcadores dos pontos cadastrados, busca por CEP e formulário de publicação de ponto para contas `COMPANY`. A alça da folha inferior tem "pill" e dica de arrasto estilizadas.
- Telas: início, login, callback OAuth, cadastro, recuperação/verificação/nova senha, home, mapa, detalhes do ponto, agendamento, confirmação/cancelamento, reciclagem, perfil, dados, notificações e ajuda.
- Fluxo do usuário: `home` com próxima coleta e atalhos, `/recompensas` (créditos por coleta, sem anúncios), `/qr-code` (QR real com validade de 10 minutos e botão de atualizar) e `/conversas` (chat por coleta).
- Fluxo da empresa: `/dashboard-empresa` (KPIs e decisões Receber/Buscar/Recusar com confirmação; Buscar avisa no chat e abre a rota no Google Maps/Waze/Apple Maps), `/mapa-empresa` (Leaflet com pino arrastável, raio e edição por ponto; pontos de outras organizações continuam visíveis), `/agenda-empresa` (Hoje/Semana/Mês com detalhe e ações), `/escanear-qr` (câmera com `BarcodeDetector`, código manual como fallback, peso real e foto) e `/materiais-empresa` (lotes, impacto e CSV auditável).
- Rotas legadas redirecionam conforme o papel; `/encontrar-catadores` agora volta para `/mapa`.

## Integrações externas

Brevo (e-mail), CepAberto (geocodificação) e Supabase (storage) são opcionais. Em desenvolvimento sem credenciais o fluxo principal continua funcional: o código de verificação aparece no log do backend, as imagens de perfil ficam no disco local e o endereço vem de ViaCEP + Nominatim.

O login social usa OAuth2 authorization-code com state e PKCE (Google/Apple) quando as credenciais estão configuradas. O callback do provedor volta para `/api/auth/social/{provider}/callback` e o backend redireciona para `/oauth/callback` com o JWT da Solus. Sem credenciais, `/api/auth/social/{provider}/url` retorna `demo: true` e o frontend chama `/api/auth/social/{provider}/demo`, que cria/reaproveita uma conta local (por exemplo `demo.google@solusrecycle.app`) e emite um JWT real.

## Validação dos fluxos

1. Cadastro de comunidade (CPF) ou organização (CNPJ), com máscaras e ViaCEP.
2. Verificação com o código enviado (ou logado no console).
3. Login com senha ou Apple/Facebook/Google, carregando os dados via `/api/auth/me`.
4. Mapa com pontos semeados, busca por CEP e publicação de ponto por organização.
5. Navegação pelas abas, mapa, agendamento e perfil.
6. Usuário solicita a coleta no mapa; a empresa decide em `/dashboard-empresa` e confirma pelo endpoint `confirmar`.
7. Usuário exibe o QR em `/qr-code?coleta={id}`; a empresa lê em `/escanear-qr` e conclui com peso/foto, liberando créditos e um lote.
8. Chat em `/conversas?coleta={id}`, cancelamento em `/confirmacao-cancelamento` e extrato em `/recompensas`.
9. Edição do ponto e do raio em `/mapa-empresa`, com persistência via `PUT /api/pontos-coleta/{id}`.

## Limitações conhecidas / prioridades de melhoria

- Conversas, créditos e lotes ainda vivem em `localStorage` (`frontend/src/utils/operations.ts`) porque o backend não tem contrato para eles. As mensagens registram o autor (`USER`/`COMPANY`) para que cada papel veja seus balões à direita; por isso a chave do chat passou para `solus.chat.v2` e conversas antigas em `v1` não são migradas.
- A validade do QR é apenas local; o backend ainda não valida expiração nem evita reuso do código.
- A câmera depende de `BarcodeDetector`; em navegadores sem suporte, use a leitura manual do código.
- A tela `Centenha.png` do canvas ainda não foi implementada.
