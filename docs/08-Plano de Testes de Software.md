# Plano de Testes de Software

<span style="color:red">Pré-requisitos: <a href="02-Especificação do Projeto.md"> Especificação do Projeto</a></span>, <a href="04-Projeto de Interface.md"> Projeto de Interface</a>

## Versão 2.0 (outubro de 2026)

Três níveis de teste, todos automatizados ou roteirizados:

1. **Testes automatizados da API** (`node:test` + supertest, banco SQLite temporário por arquivo): `npm test --prefix src/Markaki/backend`.
2. **Testes automatizados do app** (regras puras, `node:test`): `npm test --prefix src/Markaki`.
3. **Verificação das telas no navegador** (Expo web + Chrome headless, roteiros de clique) e **teste de carga** (`backend/carga`, ver [resultados](carga/2026-10-04-resultados.md)).

| Caso de teste | Requisito | Objetivo | Onde | Critério de êxito |
|---|---|---|---|---|
| CT01 Cadastrar paciente | RF-004 | Criar conta só de paciente, com senha em hash e validação dos campos | `backend/test/auth.test.js` | 201 com token; 400 para dado inválido; 409 para e-mail repetido; `papel` do corpo ignorado |
| CT02 Efetuar login | RF-004 | Entrar com e-mail e senha | `auth.test.js` | 200 com token; 401 com a mesma mensagem para e-mail e senha errados; 429 a partir da 6ª tentativa no minuto |
| CT03 Sessão | RF-004, RNF-001 | Token ausente, adulterado, expirado ou anterior à troca de senha | `auth.test.js` | 401 em todos os casos, com mensagem de sessão expirada quando for o caso |
| CT04 Papéis | RNF-001 | Paciente não administra médicos, agenda nem painel; gestor não agenda por paciente | `medicos.test.js`, `horarios.test.js`, `agendamentos.test.js` | 403 |
| CT05 Conferir disponibilidade | RF-001 | Paciente vê só horários livres e futuros, sem dados de outras pessoas | `horarios.test.js` | Lista sem horários ocupados, bloqueados ou passados; sem `paciente_nome` |
| CT06 Agendar horário | RF-001 | Agendar para si; regras de horário livre, futuro, do médico certo e limite de 3 consultas | `agendamentos.test.js` | 201; 404/409/400 nos casos de erro |
| CT07 Concorrência | RF-001 | 10 pacientes no mesmo horário ao mesmo tempo | `agendamentos.test.js` e carga S2 | Exatamente um 201; nenhum agendamento duplicado |
| CT08 Cancelar consulta | RF-001 | Cancelamento lógico, só pela dona ou pela clínica | `agendamentos.test.js` | Status `cancelado` com data e autor; horário volta a ficar livre; 404 para outra paciente; 409 para consulta passada |
| CT09 Gerir agenda | RF-002 | Cadastrar, bloquear, desbloquear, mover e remover horários | `horarios.test.js` | Data e hora validadas; 409 para horário com consulta ou repetido |
| CT10 Gerir médicos | RF-002 | Cadastrar, editar (nome propaga para a agenda e consultas ativas) e remover | `medicos.test.js` | 409 com consulta futura; histórico preservado na remoção |
| CT11 Painel | RF-005 | Números do dia e da semana | `agendamentos.test.js` | Contagens corretas |
| CT12 Segurança HTTP | RNF-001 | helmet, CORS por lista, corpo de 10 KB, JSON inválido, 404 em JSON | `auth.test.js` | Cabeçalhos presentes; 413; 400; origem estranha sem `Access-Control-Allow-Origin` |
| CT13 Transação | RNF-001 | Erro no meio da escrita desfaz tudo; UNIQUE barra duplicado fora do serviço | `agendamentos.test.js` | Banco inalterado |
| CT14 Cliente HTTP do app | RNF-001 | Token no cabeçalho, timeout, erro de conexão, aviso de sessão perdida | `src/servicos/cliente.test.mjs` | Erros com mensagem para a pessoa; aviso só com token |
| CT15 Validação e contraste | RNF-003 | Formulários com as mesmas regras da API; pares de cor com contraste AA | `validacao.test.mjs`, `contraste.test.mjs` | Todos os pares >= 4,5:1 |
| CT16 Fluxos nas telas | RF-001, RF-002, RF-004 | Paciente: cadastro (validação), login, agendar, consultas, cancelar. Clínica: painel, bloquear, abrir horários, editar médico. Sem conexão e 404 | Roteiros no navegador; prints em `docs/img/app` | Fluxos concluídos sem erro de tela |
| CT18 Modo demonstração | RNF-001 | Contas demo sem senha no código, `GET /api/demo`, contas protegidas, reset do cenário | `backend/test/demo.test.js` | 404 com o modo desligado; login das duas contas; 403 ao trocar senha; nenhuma senha conhecida no código |
| CT17 Carga | RNF-002 | Hipóteses S1 a S7 antes e depois da troca para SQLite | `backend/carga` | Ver [resultados](carga/2026-10-04-resultados.md) |

## Plano original (versão acadêmica)

Apresente os cenários de testes utilizados na realização dos testes da sua aplicação. Escolha cenários de testes que demonstrem os requisitos sendo satisfeitos.

Não deixe de enumerar os casos de teste de forma sequencial e de garantir que o(s) requisito(s) associado(s) a cada um deles está(ão) correto(s) - de acordo com o que foi definido na seção "2 - Especificação do Projeto". 

Por exemplo:
 
| **Caso de Teste** 	| **CT01 – Cadastrar perfil** 	|
|:---:	|:---:	|
|	Requisito Associado 	| RF-00X - A aplicação deve apresentar, na página principal, a funcionalidade de cadastro de usuários para que esses consigam criar e gerenciar seu perfil. |
| Objetivo do Teste 	| Verificar se o usuário consegue se cadastrar na aplicação. |
| Passos 	| - Acessar o navegador <br> - Informar o endereço do site https://adota-pet.herokuapp.com/src/index.html<br> - Clicar em "Criar conta" <br> - Preencher os campos obrigatórios (e-mail, nome, sobrenome, celular, CPF, senha, confirmação de senha) <br> - Aceitar os termos de uso <br> - Clicar em "Registrar" |
|Critério de Êxito | - O cadastro foi realizado com sucesso. |
|  	|  	|
| Caso de Teste 	| CT02 – Efetuar login	|
|Requisito Associado | RF-00Y	- A aplicação deve possuir opção de fazer login, sendo o login o endereço de e-mail. |
| Objetivo do Teste 	| Verificar se o usuário consegue realizar login. |
| Passos 	| - Acessar o navegador <br> - Informar o endereço do site https://adota-pet.herokuapp.com/src/index.html<br> - Clicar no botão "Entrar" <br> - Preencher o campo de e-mail <br> - Preencher o campo da senha <br> - Clicar em "Login" |
|Critério de Êxito | - O login foi realizado com sucesso. |
|  	|  	|
| Caso de Teste 	| CT03 – Conferir disponibilidade de horário	|
|Requisito Associado | RF-005	- A aplicação deve possuir opções de horários para conferencia dos usuários se possui disponibilidade  . |
| Objetivo do Teste 	| Verificar se existe horário disponivél. |
| Passos 	| - Acessar o aplicativo, e de acordo com o calendário conferir se existem horários disponivéis pra agendamento. |
|Critério de Êxito | - A exibição de horários pro dia escolhido pelo usuário. |
|  	|  	|
| Caso de Teste 	| CT04 – Agendar horário	|
|Requisito Associado | RF-001	- A aplicação deve possuir opção de agendar um horário escolhido pelo usuário. |
| Objetivo do Teste 	| Verificar se o usuário consegue agendar um horário. |
| Passos 	| - Acessar o aplicativo, e de acordo com a diponibilidade de horário pro dia desejado, selecionar um horário disponivél e fazer o agendamento do mesmo. |
|Critério de Êxito | - O agendamento foi realizado com sucesso. |
|  	|  	|
 
> **Links Úteis**:
> - [IBM - Criação e Geração de Planos de Teste](https://www.ibm.com/developerworks/br/local/rational/criacao_geracao_planos_testes_software/index.html)
> - [Práticas e Técnicas de Testes Ágeis](http://assiste.serpro.gov.br/serproagil/Apresenta/slides.pdf)
> -  [Teste de Software: Conceitos e tipos de testes](https://blog.onedaytesting.com.br/teste-de-software/)
> - [Criação e Geração de Planos de Teste de Software](https://www.ibm.com/developerworks/br/local/rational/criacao_geracao_planos_testes_software/index.html)
> - [Ferramentas de Test para Java Script](https://geekflare.com/javascript-unit-testing/)
> - [UX Tools](https://uxdesign.cc/ux-user-research-and-user-testing-tools-2d339d379dc7)
