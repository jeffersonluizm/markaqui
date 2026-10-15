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
    ├── scripts/semear.js       # cenário de demonstração (médicos, agenda, consultas)
    ├── scripts/criar-gestor.js # conta real de gestor (o app não tem autocadastro de gestor)
    ├── test/                   # node:test + supertest, banco temporário por arquivo
    └── carga/                  # teste de carga (autocannon), ver docs/carga
```

## Rodar

Pré-requisito: Node.js 22 ou mais novo (testado no 24). No Windows, o `iniciar.bat` da raiz faz tudo abaixo sozinho.

```bash
# API
cd src/Markaki/backend
npm install
cp .env.example .env         # preencha JWT_SECRET (32+ caracteres) e DEMO_ENABLED=true para a demonstração
npm run semear               # cria dados/markaqui.db com médicos, agenda e consultas de exemplo
npm start                    # http://127.0.0.1:3000/api/saude (com a demo: /api/demo)
npm run criar-gestor -- --nome "Ana Souza" --email ana@clinica.com.br   # gestor real (fora da demo)

# App (outro terminal)
cd src/Markaki
npm install
cp .env.example .env         # EXPO_PUBLIC_API_URL
npx expo start               # "w" abre no navegador, "a" no emulador Android, QR code no Expo Go
```

O `iniciar.bat` da raiz faz tudo isso: confere o Node, instala, cria os dois `.env` (com um `JWT_SECRET` aleatório e `DEMO_ENABLED=true`), prepara o banco, espera a API e abre o app no navegador.

### Variáveis da API (`backend/.env`)

| Variável | Padrão | Para quê |
|---|---|---|
| `JWT_SECRET` | (obrigatória) | Segredo dos tokens. A API não sobe com menos de 32 caracteres. |
| `FUSO_HORARIO` | `America/Sao_Paulo` | Fuso da clínica para "hoje" e "agora" (o servidor pode estar em UTC) |
| `PORT` / `HOST` | `3000` / `127.0.0.1` | Use `HOST=0.0.0.0` para o celular na mesma rede alcançar a API. |
| `DB_FILE` | `backend/dados/markaqui.db` | Arquivo do SQLite (fora do Git). |
| `CORS_ORIGENS` | `http://localhost:8081,http://localhost:19006` | Origens do navegador liberadas. |
| `LIMITE_AUTH_POR_MINUTO` | `5` | Tentativas de login, cadastro e troca de senha por IP. |
| `LIMITE_GLOBAL_POR_MINUTO` | `300` | Requisições por IP (0 desliga). |
| `LIMITE_CONSULTAS_ATIVAS` | `3` | Consultas futuras ativas por paciente. |
| `LIMITE_LISTAGEM` | `500` | Itens por listagem: a clínica recebe os mais recentes por data, a paciente os horários livres mais próximos |
| `BCRYPT_CUSTO` / `JWT_VALIDADE` | `10` / `8h` | Custo do hash e validade da sessão. |
| `DEMO_ENABLED` | `false` | Liga o modo demonstração: "Entrar como paciente / clínica" sem senha (`GET /api/demo`, `POST /api/demo/entrar`). Só com banco exclusivo de demo. |
| `DEMO_RESET_MINUTOS` | `0` | Recria o cenário de demonstração a cada N minutos (0: só com banco vazio) |
| `DEMO_MAX_VISITANTES` | `50` | Pacientes efêmeras ao mesmo tempo (cada "Entrar como paciente" cria uma); acima disso, a mais antiga sai com as consultas dela |
| `DEMO_MAX_MEDICOS`, `DEMO_MAX_HORARIOS` | `20`, `500` | Tetos do que os visitantes criam como clínica na demonstração (409 acima disso). O cenário de exemplo (ids `demo-*`) não sai nem muda de data (403) |
| `DEMO_ENTRADAS_POR_MINUTO` | `10` | "Entrar como" por IP por minuto |
| `DEMO_GESTOR_EMAIL` | `gestor@markaqui.demo` | E-mail do gestor de demonstração (sem senha utilizável) |
| `TRUST_PROXY` | `0` | Proxies na frente da API (`1` no Render), para o limite por IP valer por visitante |

### Variáveis do app (`src/Markaki/.env`)

| Variável | Exemplo |
|---|---|
| `EXPO_PUBLIC_API_URL` | navegador ou iOS na mesma máquina: `http://localhost:3000/api`; emulador Android: `http://10.0.2.2:3000/api`; celular: `http://IP_DO_COMPUTADOR:3000/api` |

## API

Todas as rotas, menos `saude`, `auth/login` e `auth/cadastro`, pedem `Authorization: Bearer <token>`.

| Método e rota | Quem | O que faz |
|---|---|---|
| `GET /api/saude` | todos | Confere se a API está no ar (health check da hospedagem) |
| `GET /api/demo` | todos | Com `DEMO_ENABLED=true`, os papéis da demonstração (sem e-mail nem senha); senão 404 |
| `POST /api/demo/entrar` | todos | `{ papel }`: sessão de uma paciente efêmera nova ou do gestor de demonstração; senão 404 |
| `POST /api/auth/cadastro` | sem login | Cria conta de **paciente** (`nome`, `email`, `telefone`, `senha`, `aceite_termos`) |
| `POST /api/auth/login` | sem login | Devolve `{ token, usuario }` |
| `GET` / `PUT /api/auth/eu` | logado | Perfil (altera só `nome` e `telefone`) |
| `PUT /api/auth/senha` | logado | Troca a senha, derruba as outras sessões e devolve token novo (contas demo: 403) |
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

- `usuarios`: id, nome, email (único, sem diferenciar maiúsculas), telefone, senha_hash (bcrypt), papel (`paciente` ou `gestor`), criado_em, versao_token (troca de senha derruba sessões), demo (conta protegida).
- `medicos`: id, nome, especialidade.
- `horarios`: id, medico_id, data, hora, bloqueado. UNIQUE (medico_id, data, hora).
- `agendamentos`: id, horario_id, medico_id, paciente_id, cópia de médico, paciente, data e hora (para o histórico), status (`agendado` ou `cancelado`), criado_em, cancelado_em, cancelado_por. Índices UNIQUE parciais: um agendamento ativo por horário e uma consulta ativa por paciente no mesmo dia e hora.

"Livre", "bloqueado" e "agendado" são calculados na consulta a partir do agendamento ativo, sem coluna duplicada. Migrações em `backend/src/infra/sqlite/esquema.js` (versão no `PRAGMA user_version`).

## Testes

```bash
npm test --prefix src/Markaki/backend   # API: 103 testes (auth, papéis, demo e proteções da demo, médicos, agenda, agendamentos, concorrência, configuração, fuso, resumos de carga)
npm test --prefix src/Markaki           # app: 53 testes (cliente HTTP, servidor acordando, validação, formatação, agenda, demonstração, conferência do build, contraste)
npm run lint && npm run formato         # ESLint e Prettier, em cada pacote (também no CI)
```

## Teste de carga

`npm run carga -- --armazenamento final` (na pasta `backend`) mede os cenários S1 a S7 numa pasta temporária. Hipóteses, protocolo e resultados: [`docs/carga`](../../docs/carga/2026-10-04-resultados.md).
