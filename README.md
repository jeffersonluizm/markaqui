<div align="center">
  <img src="src/Markaki/assets/icon.png" width="88" alt="Logo do Markaqui">

# Markaqui

**Agendamento de consultas para clínica médica.** A paciente vê os horários livres, agenda em quatro toques e acompanha ou cancela pelo celular. A clínica administra médicos, agenda e consultas num painel.

App Expo (React Native) · API Node/Express · SQLite · login com papéis · teste de carga com hipóteses

</div>

<p align="center">
  <b><a href="https://markaqui.vercel.app">Abrir a demonstração</a></b> · API: <a href="https://markaqui-api.onrender.com/api/saude">markaqui-api.onrender.com</a> · <a href="docs/deploy.md">como publicar</a>
</p>

> Na tela inicial, use **Explore a demonstração** e entre **como paciente** ou **como clínica** com um clique (sem cadastro). A primeira visita pode levar até um minuto enquanto o servidor gratuito acorda. Os dados são fictícios e voltam ao original a cada 6 horas.


<p align="center">
  <img src="docs/img/demo.gif" width="300" alt="Fluxo: entrar como paciente com um clique, agendar uma consulta, ver o histórico; depois entrar como clínica e ver o painel e a agenda">
</p>

<p align="center">
  <img src="docs/img/app/01-boas-vindas.png" width="200" alt="Tela de boas-vindas com missão, visão e valores">
  <img src="docs/img/app/08-agenda-do-medico.png" width="200" alt="Agenda do médico com escolha de dia e horário">
  <img src="docs/img/app/11-consultas.png" width="200" alt="Lista de próximas consultas da paciente">
  <img src="docs/img/app/21-agenda-clinica.png" width="200" alt="Agenda da clínica com horários livres, bloqueados e agendados">
</p>

## O que tem aqui

| Para a paciente | Para a clínica (gestor) |
|---|---|
| Criar conta, entrar, trocar senha | Painel com consultas de hoje e da semana |
| Ver médicos por especialidade | Cadastrar, editar e remover médicos |
| Agendar: médico, dia, hora, confirmar | Abrir vários horários de uma vez, bloquear e desbloquear |
| Próximas consultas e histórico | Ver todas as consultas e cancelar |
| Cancelar até o horário da consulta | Conta criada só pela administração (sem autocadastro) |

Também: boas-vindas e escolha de perfil, recuperar senha (honesta: explica o caminho, porque o app não envia e-mail), termos, página "Sobre / como foi feito", 404, erro global, estado "sem conexão com o servidor", carregando, vazio e erro em toda lista, avisos em Snackbar e confirmação própria para ações destrutivas.

<details>
<summary><b>Mais telas</b></summary>
<p>
  <img src="docs/img/app/02-escolha-de-perfil.png" width="180" alt="Escolha de perfil: paciente ou clínica">
  <img src="docs/img/app/03-cadastro-validacao.png" width="180" alt="Cadastro com mensagens de validação">
  <img src="docs/img/app/05-entrar.png" width="180" alt="Tela de login">
  <img src="docs/img/app/06-inicio-paciente.png" width="180" alt="Início da paciente com a próxima consulta">
  <img src="docs/img/app/09-confirmar.png" width="180" alt="Confirmação do agendamento">
  <img src="docs/img/app/10-agendado.png" width="180" alt="Consulta agendada">
  <img src="docs/img/app/13-cancelar-consulta.png" width="180" alt="Diálogo de cancelamento">
  <img src="docs/img/app/20-painel-clinica.png" width="180" alt="Painel da clínica">
  <img src="docs/img/app/22-abrir-horarios.png" width="180" alt="Abrir vários horários de uma vez">
  <img src="docs/img/app/24-editar-medico.png" width="180" alt="Editar médico">
  <img src="docs/img/app/04-recuperar-senha.png" width="180" alt="Recuperar senha">
  <img src="docs/img/app/29-acordando-servidor.png" width="180" alt="Acordando o servidor de demonstração">
  <img src="docs/img/app/12-historico.png" width="180" alt="Histórico com consulta cancelada e realizada">
  <img src="docs/img/app/31-desktop-painel.png" width="560" alt="Painel da clínica no navegador do computador">
  <img src="docs/img/app/28-sem-conexao.png" width="180" alt="Estado sem conexão com o servidor">
</p>
<p>Prints reais tirados do app rodando no navegador (Expo web) com os dados de demonstração.</p>
</details>

## Arquitetura

```mermaid
flowchart LR
  App["App Expo<br/>React Navigation por papel<br/>React Native Paper (MD3)"] -- "HTTP + token Bearer" --> MW
  subgraph API["API Express"]
    MW["helmet · CORS por lista<br/>10 KB · limites por IP"] --> Auth["JWT + papel<br/>lido do banco"] --> Rotas --> Validacoes --> Servicos["Serviços<br/>(regras)"] --> Repos["Repositórios"]
  end
  Repos -- "transação IMMEDIATE" --> DB[("SQLite<br/>UNIQUE: 1 agendamento<br/>ativo por horário")]
```

Decisões registradas em [ADRs](docs/adr/README.md). Detalhes: [Arquitetura da Solução](docs/05-Arquitetura%20da%20Solução.md) (camadas, segurança, modelo de dados) e [guia do código](src/Markaki/README.md) (estrutura, variáveis, rotas da API).

## Testes

```bash
npm test --prefix src/Markaki/backend   # 81 testes da API, banco SQLite temporário
npm test --prefix src/Markaki           # 44 testes do app (cliente HTTP, validação, agenda, servidor acordando, contraste)
npm run lint && npm run formato        # em cada pacote: ESLint e Prettier (também no CI)
```

Cobrem login e sessão (401, sessão expirada, senha trocada), papéis (403), limites (413, 429), modo demonstração (404 desligado, contas protegidas, nenhuma senha no código), regras da agenda, concorrência (10 pacientes no mesmo horário: um só entra), cancelamento lógico e contraste de cores WCAG AA. O GitHub Actions roda tudo a cada push ([ci.yml](.github/workflows/ci.yml)). Plano completo em [docs/08](docs/08-Plano%20de%20Testes%20de%20Software.md).

## Teste de carga

Antes de trocar o armazenamento, as hipóteses foram escritas e a API foi medida com o arquivo JSON da primeira versão; depois, medida de novo com SQLite, com o mesmo roteiro (autocannon, banco descartável numa pasta temporária, gerador e servidor na mesma máquina). Resultados, gráfico e quais hipóteses se confirmaram: [docs/carga](docs/carga/2026-10-04-resultados.md).

| Cenário (10.000 horários) | Arquivo JSON (antes) | SQLite (depois) |
|---|---|---|
| Leitura da agenda de um médico | 93 req/s, p97,5 620 ms | 1.266 req/s, p97,5 48 ms |
| Escrita com 50 conexões | 43 escritas/s, p97,5 1,5 s | 5.863 escritas/s, p97,5 10 ms |
| Misto 90/10 com 300 conexões | 4.663 erros, p97,5 7,3 s | 0 erro, p97,5 250 ms |
| Leitores e escritores ao mesmo tempo | 100% das escritas com erro 500 (`EPERM` no Windows) | 0 erro |
| 4.000 pedidos no mesmo horário (200 horários) | 0 duplicado | 0 duplicado |

<img src="docs/carga/2026-10-14-grafico.svg" alt="Gráfico: leitura, escrita e latência do arquivo JSON e do SQLite" width="760">

## Decisões

- **Clínica médica, não B2B genérico.** A proposta acadêmica (abaixo) era agendamento para prestadoras de serviço; o código sempre foi de clínica, então a versão 2.0 assume esse domínio. A situação de cada requisito está em [docs/02](docs/02-Especificação%20do%20Projeto.md#situação-na-versão-20-outubro-de-2026).
- **SQLite no lugar do arquivo JSON:** transações e índices UNIQUE em vez de uma fila global que relia e regravava o arquivo inteiro a cada escrita. Medido antes e depois.
- **Segurança por padrão:** gestor real só por script, papel lido do banco, paciente vê só os próprios dados, senha com bcrypt, limite de tentativas, API em `127.0.0.1` a menos que se peça a rede.
- **Modo demonstração sem senha no código:** `DEMO_ENABLED` liga contas de exemplo com senhas do ambiente ou geradas na partida, expostas só por `GET /api/demo`; contas protegidas e dados recriados de tempos em tempos ([ADR 0004](docs/adr/0004-modo-demonstracao.md)).
- **Hospedagem gratuita:** API no Render e app web na Vercel, com tela de "acordando o servidor" ([ADR 0005](docs/adr/0005-hospedagem.md)).
- **Cancelamento lógico:** a consulta cancelada fica no histórico, com data e quem cancelou.
- **Identidade do próprio projeto:** marinho, azul-gelo e Inter, tirados dos protótipos da equipe ([docs/06](docs/06-Template%20Padrão%20da%20Aplicação.md)). O mascote dos protótipos saiu por ser parecido com um personagem de terceiros; fotos externas deram lugar a avatares com iniciais.

## Limitações

- Não envia e-mail nem notificação push: recuperar senha depende da administração.
- Uma clínica e um processo de API (SQLite local); para escalar, PostgreSQL com o mesmo desenho de repositórios.
- No navegador, o token fica no `localStorage` (no celular, no armazenamento seguro do sistema).
- Sem login com Google, sem encaixe nem lista de espera, sem relatórios de receita.

## Próximos passos

Notificações (lembrete 24 h antes), redefinição de senha pela clínica, testes de componentes das telas (React Native Testing Library), HTTPS e deploy, várias unidades.

## Rodar localmente

Pré-requisito: [Node.js](https://nodejs.org/) 22 ou mais novo.

**Windows:** dois cliques em `iniciar.bat`. Ele confere o Node, instala as dependências, cria os arquivos `.env` (com um segredo aleatório e o modo demonstração ligado), prepara o banco SQLite com o cenário de exemplo, sobe a API, espera ela responder e abre o app no navegador. Na tela inicial, **Explore a demonstração**. Para o celular, leia o QR code da janela do Expo com o Expo Go.

**Qualquer sistema:** passos em [src/Markaki/README.md](src/Markaki/README.md#rodar).

As contas de demonstração não têm senha fixa: a API gera senhas novas a cada partida e o app as obtém em `GET /api/demo`. Para uma instalação real, desligue o modo demonstração e crie o gestor com `npm run criar-gestor`.

## Projeto acadêmico

`Análise e Desenvolvimento de Sistemas` · `Projeto: Desenvolvimento de uma Aplicação Móvel em um Ambiente de Negócio` · `Terceiro Semestre` (PUC Minas)

Proposta original: um aplicativo de agendamento B2B para empresas prestadoras de serviço, com gestão de várias agendas, notificações push e painel para decisões. A versão 2.0 manteve a ideia central (agenda por profissional, autonomia de quem agenda, painel para quem administra) aplicada a uma clínica.

Integrantes: Jefferson Luiz Mendonça da Silva, Levi Alves de Oliveira Neto, Bruno Pereira Figueiredo, Kauã Eduardo Silva, William Leal Rocha Viana e Welder Fernandes de Morais. Orientador: Will Ricardo dos Santos Machado.

Versão 2.0 (portfólio, outubro de 2026): mantida por Jefferson Luiz, autor do protótipo das telas institucionais.

### Documentação

1. [Documentação de Contexto](docs/01-Documentação%20de%20Contexto.md)
2. [Especificação do Projeto](docs/02-Especificação%20do%20Projeto.md) (com a situação dos requisitos na 2.0)
3. [Metodologia](docs/03-Metodologia.md)
4. [Projeto de Interface](docs/04-Projeto%20de%20Interface.md)
5. [Arquitetura da Solução](docs/05-Arquitetura%20da%20Solução.md)
6. [Template Padrão da Aplicação](docs/06-Template%20Padrão%20da%20Aplicação.md)
7. [Programação de Funcionalidades](docs/07-Programação%20de%20Funcionalidades.md)
8. [Plano de Testes de Software](docs/08-Plano%20de%20Testes%20de%20Software.md)
9. [Registro de Testes de Software](docs/09-Registro%20de%20Testes%20de%20Software.md)
10. [Plano de Testes de Usabilidade](docs/10-Plano%20de%20Testes%20de%20Usabilidade.md)
11. [Registro de Testes de Usabilidade](docs/11-Registro%20de%20Testes%20de%20Usabilidade.md)
12. [Apresentação do Projeto](docs/12-Apresentação%20do%20Projeto.md)
13. [Referências](docs/13-Referências.md)

Protótipos da equipe (fora do app): [prototipos/](prototipos/README.md) · Apresentação: [presentation/](presentation/README.md)
