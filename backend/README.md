# Solus Recycle — API Python

Backend reimplementado em **FastAPI**, mantendo os contratos, endpoints e regras de
negócio do backend Java original (`SolusRecycle/backend`).

## Executar

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8006
```

Documentação interativa: `http://localhost:8006/docs`. Health check: `GET /health`
(retorna `UP` em texto plano).

## Banco de dados

Por padrão usa SQLite em `backend/data/solus.db` (`DB_URL`). Para PostgreSQL, defina
`DB_URL=postgresql+psycopg://usuario:senha@host:5432/banco` e instale o driver.

As tabelas são criadas automaticamente na inicialização (equivalente ao
`spring.jpa.hibernate.ddl-auto=update`), com migrações mínimas de colunas para bancos
SQLite já existentes. Com `SEED_DEMO_DATA=true` (padrão) e um arquivo SQLite local, a
inicialização cria a organização `demo.organizacao@solusrecycle.app` (senha
`Solus@2026`) e três pontos de coleta em São Paulo. Bancos em memória (`sqlite://`)
nunca recebem seed. Cadastros normais passam por `POST /api/usuario` ou
`POST /api/empresa` → `POST /api/cadastro/verificar`; uma organização verificada
publica automaticamente um ponto inicial no mapa a partir do seu CEP.

## Integrações

- **E-mail (Brevo):** se `BREVO_API_KEY` estiver vazio, os envios são apenas logados —
  o comportamento das requisições é idêntico ao Java, que engole falhas de e-mail.
- **CEP e geocodificação:** `GET /api/cep/{cep}` usa ViaCEP para o endereço e,
  sem `CEPABERTO_TOKEN`, Nominatim para as coordenadas. Com token, o CepAberto tem
  prioridade. O token não é necessário para o preenchimento de endereço no cadastro.
- **Supabase Storage:** sem `SUPABASE_URL`/`SUPABASE_KEY`, os uploads são gravados em
  `backend/data/uploads` e servidos em `/uploads/...`.

## Autenticação

JWT HS256 com `sub` = e-mail, `nome`, `iat` e `exp` (1 hora). O role é resolvido no
banco a cada requisição (`USER` ou `COMPANY`). Senhas usam Argon2id com os mesmos
parâmetros do `Argon2PasswordEncoder` Java; hashes bcrypt antigos também são
aceitos na verificação.

Login social: `GET /api/auth/social/{provider}/url?mode=login|register` inicia o
OAuth2 de `google`, `facebook` ou `apple` com state + PKCE (quando aplicável);
`GET|POST /api/auth/social/{provider}/callback` troca o código, localiza/cria a conta
e redireciona para `${FRONTEND_URL}/oauth/callback` com o JWT. Sem credenciais do
provedor, a URL retorna `demo: true` e `POST /api/auth/social/{provider}/demo` emite
o JWT de uma conta local de demonstração. `FRONTEND_URL` pode ficar vazio: a origem
do navegador (`Origin`/`Referer`) é usada automaticamente, inclusive via proxy Vite.

## Principais rotas

| Grupo | Endpoints |
|---|---|
| Auth | `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/check/{cpf,cnpj,email}` |
| Auth social | `/api/auth/social/{provider}/url`, `/callback`, `/demo` |
| Cadastro | `/api/usuario`, `/api/empresa`, `/api/cadastro/verificar`, `/api/cadastro/reenviar` |
| CEP | `GET /api/cep/{cep}` (ViaCEP + coordenadas) |
| Senha | `/api/password-reset/initiate`, `/verify-code-only`, `/verify-and-reset` |
| Agendamentos | `/api/agendamentos`, `/meus-agendamentos`, `/company/{id}`, `/{id}/{confirmar,recusar,concluir}` |
| Empresas/pontos | `/api/empresas`, `/api/pontos-coleta`, `/proximos-coord`, `/proximos-cep`, `/lote` |
| Outros | `/api/empresa/disponibilidade`, `/api/profile/*`, `/api/search`, `/api/uploads/profile-picture` |

`POST /api/usuario` aceita CPF ou CNPJ no campo `cpf`; `POST /api/empresa` aceita
CPF ou CNPJ no campo `cnpj`. Ambos persistem `complemento` no endereço. Empresas
também enviam `fazColetaDomicilio`, `materiaisColeta`, `pesoMinimoKg` e
`pesoMaximoKg`. `POST /api/pontos-coleta` geocodifica o `cep` quando latitude e
longitude não são informadas e retorna `endereco` e `companyNome` na listagem.
