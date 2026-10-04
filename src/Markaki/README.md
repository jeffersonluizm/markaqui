# Markaqui: código-fonte

App Expo (React Native) e API Node/Express com SQLite. Visão geral, prints e decisões estão no [README da raiz](../../README.md); aqui fica o guia técnico.

## Estrutura

```
src/Markaki/
├── App.js                      # fontes, tema, sessão, avisos e navegação
├── app.json                    # nome, ícone, splash e favicon do Markaqui
├── assets/                     # ícones gerados por scripts/gerar-icones.js
├── scripts/gerar-icones.js     # desenha o logo em PNG (sem dependências)
├── src/
│   ├── tema/                   # tokens (cores, raios, espaços, Inter) e tema Paper MD3
│   ├── componentes/            # Logo, Tela, Estados, Formulario, Cartoes, Seletores, ErroGlobal
│   ├── contexto/               # Sessao (login, token, sessão expirada) e Avisos (Snackbar e confirmação)
│   ├── hooks/useRecurso.js     # carregando / erro / dados, recarrega ao voltar à tela
│   ├── navegacao/              # React Navigation: pilha de conexão e abas por papel
│   ├── servicos/               # cliente HTTP, endpoints, validação, formatação, agenda (+ testes)
│   └── telas/                  # conexao/, paciente/, gestor/, comum/
└── backend/
    ├── server.js               # lê a configuração, abre o banco e sobe a API
    ├── src/
    │   ├── app.js              # helmet, CORS, limites, rotas e tratamento de erro
    │   ├── config.js           # variáveis de ambiente (JWT_SECRET obrigatório)
    │   ├── middlewares/        # autenticação por token, papel, respostas de erro
    │   ├── routes/             # auth, medicos, horarios, agendamentos (+ painel)
    │   ├── validators/         # formato e tamanho de cada campo
    │   ├── services/           # regras de negócio (o que pode e o que não pode)
    │   ├── dominio/tempo.js    # data e hora da clínica, passado e futuro
    │   └── infra/              # SQLite (esquema, migrações, repositórios), tokens, ids
    ├── scripts/semear.js       # banco de demonstração (único jeito de criar gestor)
    ├── test/                   # node:test + supertest, banco temporário por arquivo
    └── carga/                  # teste de carga (autocannon), ver docs/carga
```

## Rodar

Pré-requisito: Node.js 20 ou mais novo (testado no 24).

```bash
# API
cd src/Markaki/backend
npm install
cp .env.example .env         # preencha JWT_SECRET (32+ caracteres) e, se quiser, as senhas DEMO_*
npm run semear               # cria dados/markaqui.db com médicos, horários e as contas de demonstração
npm start                    # http://127.0.0.1:3000/api/saude

# App (outro terminal)
cd src/Markaki
npm install
cp .env.example .env         # EXPO_PUBLIC_API_URL
npx expo start               # "w" abre no navegador, "a" no emulador Android, QR code no Expo Go
```

No Windows, o `iniciar.bat` da raiz faz tudo isso: cria os dois `.env` (com um `JWT_SECRET` aleatório e as contas de demonstração), semeia o banco e abre a API e o Expo.

### Variáveis da API (`backend/.env`)

| Variável | Padrão | Para quê |
|---|---|---|
| `JWT_SECRET` | (obrigatória) | Segredo dos tokens. A API não sobe com menos de 32 caracteres. |
| `PORT` / `HOST` | `3000` / `127.0.0.1` | Use `HOST=0.0.0.0` para o celular na mesma rede alcançar a API. |
| `DB_FILE` | `backend/dados/markaqui.db` | Arquivo do SQLite (fora do Git). |
| `CORS_ORIGENS` | `http://localhost:8081,http://localhost:19006` | Origens do navegador liberadas. |
| `LIMITE_AUTH_POR_MINUTO` | `5` | Tentativas de login, cadastro e troca de senha por IP. |
| `LIMITE_GLOBAL_POR_MINUTO` | `300` | Requisições por IP (0 desliga). |
| `LIMITE_CONSULTAS_ATIVAS` | `3` | Consultas futuras ativas por paciente. |
| `BCRYPT_CUSTO` / `JWT_VALIDADE` | `10` / `8h` | Custo do hash e validade da sessão. |
| `DEMO_GESTOR_*`, `DEMO_PACIENTE_*` | e-mails `*@markaqui.demo` | Contas do `npm run semear`. Sem senha definida, ele gera uma aleatória e mostra no console. |

### Variáveis do app (`src/Markaki/.env`)

| Variável | Exemplo |
|---|---|
| `EXPO_PUBLIC_API_URL` | navegador ou iOS na mesma máquina: `http://localhost:3000/api`; emulador Android: `http://10.0.2.2:3000/api`; celular: `http://IP_DO_COMPUTADOR:3000/api` |
| `EXPO_PUBLIC_MOSTRAR_DEMO` | `1` mostra, só em desenvolvimento, os atalhos das contas de demonstração na tela de login |

## API

Todas as rotas, menos `saude`, `auth/login` e `auth/cadastro`, pedem `Authorization: Bearer <token>`.

| Método e rota | Quem | O que faz |
|---|---|---|
| `GET /api/saude` | todos | Confere se a API está no ar |
| `POST /api/auth/cadastro` | sem login | Cria conta de **paciente** (`nome`, `email`, `telefone`, `senha`, `aceite_termos`) |
| `POST /api/auth/login` | sem login | Devolve `{ token, usuario }` |
| `GET` / `PUT /api/auth/eu` | logado | Perfil (altera só `nome` e `telefone`) |
| `PUT /api/auth/senha` | logado | Troca a senha, derruba as outras sessões e devolve token novo |
| `GET /api/medicos`, `GET /api/medicos/:id` | logado | Lista e detalhe |
| `POST`, `PUT`, `DELETE /api/medicos/:id` | gestor | Cadastrar, editar (o nome novo vale para a agenda e as consultas ativas) e remover (409 com consulta futura) |
| `GET /api/horarios?medico_id=` | logado | Paciente: só livres e futuros, sem dados de outras pessoas. Gestor: agenda completa com estado e paciente |
| `POST /api/horarios` | gestor | `medico_id`, `data` (AAAA-MM-DD), `hora` (HH:MM), nada no passado |
| `PUT /api/horarios/:id` | gestor | `bloqueado`, `data`, `hora` (409 se tem consulta) |
| `DELETE /api/horarios/:id` | gestor | Remove horário sem consulta (o histórico continua) |
| `GET /api/agendamentos` | logado | Paciente: os seus. Gestor: todos. Cada um com `situacao` (agendado, cancelado, realizado) |
| `GET /api/agendamentos/:id` | dona ou gestor | Detalhe (404 para consulta de outra paciente) |
| `POST /api/agendamentos` | paciente | `{ horario_id }`. A paciente vem do token. 409 se o horário acabou de ser reservado |
| `PATCH /api/agendamentos/:id/cancelar` | dona ou gestor | Cancelamento lógico: guarda quando e quem cancelou |
| `GET /api/painel` | gestor | Consultas de hoje e dos próximos 7 dias, horários livres, médicos e a agenda do dia |

Erros sempre em JSON: `{ "erro": "mensagem para a pessoa" }`, com 400 (dado inválido), 401 (sem sessão, sessão expirada ou senha trocada), 403 (papel errado), 404, 409 (conflito de regra), 413 (corpo acima de 10 KB) e 429 (limite de tentativas).

### Modelo de dados (SQLite)

- `usuarios`: id, nome, email (único, sem diferenciar maiúsculas), telefone, senha_hash (bcrypt), papel (`paciente` ou `gestor`), criado_em, senha_alterada_em.
- `medicos`: id, nome, especialidade.
- `horarios`: id, medico_id, data, hora, bloqueado. UNIQUE (medico_id, data, hora).
- `agendamentos`: id, horario_id, medico_id, paciente_id, cópia de médico, paciente, data e hora (para o histórico), status (`agendado` ou `cancelado`), criado_em, cancelado_em, cancelado_por. Índices UNIQUE parciais: um agendamento ativo por horário e uma consulta ativa por paciente no mesmo dia e hora.

"Livre", "bloqueado" e "agendado" são calculados na consulta a partir do agendamento ativo, sem coluna duplicada. Migrações em `backend/src/infra/sqlite/esquema.js` (versão no `PRAGMA user_version`).

## Testes

```bash
npm test --prefix src/Markaki/backend   # API: 65 testes (auth, papéis, médicos, agenda, agendamentos, concorrência, configuração)
npm test --prefix src/Markaki           # app: 40 testes (cliente HTTP, validação, formatação, agenda, contraste de cores)
```

## Teste de carga

`npm run carga -- --armazenamento final` (na pasta `backend`) mede os cenários S1 a S7 numa pasta temporária. Hipóteses, protocolo e resultados: [`docs/carga`](../../docs/carga/2026-10-04-resultados.md).
