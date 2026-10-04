# Registro de Testes de Software

<span style="color:red">Pré-requisitos: <a href="04-Projeto de Interface.md"> Projeto de Interface</a></span>, <a href="08-Plano de Testes de Software.md"> Plano de Testes de Software</a>

## Versão 2.0 (registro de 4 de outubro de 2026)

Ambiente: Windows 11, Node.js 24.11.1, Chrome 154 (headless), Lighthouse 12.8, Ryzen 5 5600, 16 GB.

| Suíte | Comando | Resultado |
|---|---|---|
| API (CT01 a CT13) | `npm test --prefix src/Markaki/backend` | 65 de 65 aprovados (6 arquivos: auth, médicos, horários, agendamentos, configuração) |
| App (CT14, CT15) | `npm test --prefix src/Markaki` | 40 de 40 aprovados (cliente HTTP, validação, formatação, agenda, contraste) |
| Build web | `npx expo export --platform web` | Gerado sem erros (1,56 MB); as senhas de demonstração não aparecem no bundle de produção |
| Lighthouse (build web, tela inicial, celular) | `lighthouse --only-categories=accessibility,best-practices` | Acessibilidade 100, Boas práticas 100 |
| Fluxos nas telas (CT16) | Roteiros no Chrome headless contra a API com banco de demonstração | Paciente: escolha de perfil, cadastro com erros, login, agendar, consultas, histórico, diálogo de cancelamento, perfil. Clínica: painel, bloquear horário, abrir 3 horários, editar médico, consultas. Sem conexão, 404 e Sobre. Todos concluídos |
| Carga (CT17) | `npm run carga` | Ver [resultados](carga/2026-10-04-resultados.md) |

Evidências dos fluxos: prints em [`docs/img/app`](img/app). Aviso conhecido no console do navegador: o `@react-navigation/bottom-tabs` registra um alerta do React sobre `style` num `Fragment` interno da biblioteca; não afeta o uso.

## Registro da versão acadêmica

Para cada caso de teste definido no Plano de Testes de Software, realize o registro das evidências dos testes feitos na aplicação pela equipe, que comprovem que o critério de êxito foi alcançado (ou não!!!). Para isso, utilize uma ferramenta de captura de tela que mostre cada um dos casos de teste definidos (obs.: cada caso de teste deverá possuir um vídeo do tipo _screencast_ para caracterizar uma evidência do referido caso).

| **Caso de Teste** 	| **CT01 – Cadastrar perfil** 	|
|:---:	|:---:	|
|	Requisito Associado 	| RF-00X - A aplicação deve apresentar, na página principal, a funcionalidade de cadastro de usuários para que esses consigam criar e gerenciar seu perfil. |
|Registro de evidência | www.teste.com.br/drive/ct-01 |

| **Caso de Teste** 	| **CT02 – Realizar login** 	|
|:---:	|:---:	|
|	Requisito Associado 	| RF-00Y - A aplicação deve permitir que um usuário previamente cadastrado faça login |
|Registro de evidência | www.teste.com.br/drive/ct-02 |


| **Caso de Teste** 	| **CT03 – Calendario com os dias** 	|
|:---:	|:---:	|
|	Requisito Associado 	| RF-005 - Dashboard Gerencial Móvel: O Administrador deve ter acesso a um painel visual com métricas chave (agendamentos do dia, receita prevista, etc.).  |
|Registro de evidência | ![calendario](https://github.com/user-attachments/assets/5e2cfb18-12d8-421e-93f2-67be44c9b2dd) |

| **Caso de Teste** 	| **CT04 – Horário no dia escolhido** 	|
|:---:	|:---:	|
|	Requisito Associado 	| RF-001 - A aplicação deve possuir opção de agendar um horário escolhido pelo usuário. |
|Registro de evidência | ![diaescolhido1](https://github.com/user-attachments/assets/641fd7b7-b05a-465a-bbf3-2c3fbe585eef)
![agendamentodia1](https://github.com/user-attachments/assets/56698b89-d74d-41bf-ab5e-05cefa0e8f6c) |

## Relatório de testes de software

Durante o registro de testes visamos atender a todos os requisitos funcionais apresentados no inicio e na especificação do projeto. Seguimos os requisitos funcionais como base tanto para desenvolver o aplicativo quanto para fazer os principais testes da aplicação. 
Para próximas iterações, o grupo pretende, não só melhorar o design das telas e corrigir as falhas encontradas, mas principalmente, implementar soluções para otimizar ainda mais o processo para os usuários que fazem uso da aplicação. 

> **Links Úteis**:
> - [Ferramentas de Test para Java Script](https://geekflare.com/javascript-unit-testing/)
