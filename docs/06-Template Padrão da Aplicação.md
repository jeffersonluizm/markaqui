# Template Padrão da Aplicação

<span style="color:red">Pré-requisitos: <a href="02-Especificação do Projeto.md"> Especificação do Projeto</a></span>, <a href="04-Projeto de Interface.md"> Projeto de Interface</a>, <a href="03-Metodologia.md"> Metodologia</a>

Identidade visual do Markaqui, tirada dos protótipos e wireframes da própria equipe (`prototipos/`, `docs/img/sobre.png`, `docs/img/tipoperfil.png`). No código, tudo vem de um lugar só: [`src/tema/tokens.js`](../src/Markaki/src/tema/tokens.js) e o tema do React Native Paper em [`src/tema/tema.js`](../src/Markaki/src/tema/tema.js).

## Logo e ícones

<img src="../src/Markaki/assets/icon.png" width="96" alt="Logo do Markaqui: calendário branco com um sinal de confirmação azul-gelo sobre um quadrado marinho de cantos arredondados">

Calendário com "check" sobre o quadrado marinho. O mesmo desenho existe como componente (`src/componentes/Logo.js`, SVG) e como PNG (ícone, ícone adaptativo do Android, splash e favicon), gerados por `npm run icones` sem dependências externas. O mascote dos protótipos saiu por ser parecido com um personagem de terceiros. Fotos de médicos também não são usadas: o avatar é sempre com as iniciais.

Ícones da interface: Material Community Icons (os mesmos do React Native Paper). Nas abas, o ícone cheio marca a aba ativa e o de contorno as demais, para o estado não depender só da cor.

## Cores

| Token | Cor | Uso |
|---|---|---|
| `marinho` | `#1e3a56` | Cor primária: botões, abas ativas, ícones |
| `marinhoEscuro` | `#0D2136` | Títulos e marca |
| `gelo` | `#d8ecf5` | Fundo das telas de boas-vindas e destaques |
| `fundo` | `#f7fbfd` | Fundo das telas de trabalho |
| `superficie` | `#ffffff` | Cartões e campos |
| `selecionado` | `#eef6fb` | Estado selecionado |
| `borda` / `bordaSuave` | `#cbd5e1` / `#e2e8f0` | Contornos |
| `texto` / `textoSecundario` / `textoSuave` | `#0f172a` / `#475569` / `#64748b` | Textos |
| `erro` + `erroFundo` | `#b91c1c` + `#fde8e8` | Erros e ações destrutivas |
| `sucesso` + `sucessoFundo` | `#1f6f3a` + `#e3f3e8` | Livre, realizada, sucesso |
| `aviso` + `avisoFundo` | `#92400e` + `#fef3c7` | Bloqueado, avisos |

Contraste: todos os pares de texto usados passam no WCAG AA (4,5:1 ou mais). O teste `src/tema/contraste.test.mjs` calcula cada par; por exemplo, branco sobre marinho dá 11,7:1 e o texto secundário sobre branco, 7,6:1.

## Tipografia

Inter (Google Fonts, carregada com `@expo-google-fonts/inter`), em quatro pesos: 400 para texto, 500 para rótulos, 600 para títulos de seção e botões, 700 para títulos de tela e números. Cada variante do Material Design 3 aponta para o arquivo do peso certo (no Android, só `fontWeight` não troca de fonte).

## Formas e espaçamento

- Botões principais em pílula (raio 30), como nos protótipos; cartões com raio 18 e borda de 1 a 2 px; campos com raio 12.
- Espaçamento em múltiplos de 4 (4, 8, 12, 16, 24, 32, 48).
- Alvo de toque mínimo de 48 dp em botões, chips de dia e hora e ações da agenda.
- Coluna de conteúdo com largura máxima de 720 px: no navegador o app não estica.

## Componentes base

| Componente | Arquivo | Para quê |
|---|---|---|
| `Tela`, `TituloTela`, `TituloSecao` | `src/componentes/Tela.js` | Moldura com fundo, rolagem, puxar para atualizar e teclado que não cobre campos |
| `EstadoCarregando`, `EstadoVazio`, `EstadoErro`, `ConteudoRemoto` | `src/componentes/Estados.js` | Os três estados de toda lista; erro distingue sem conexão, sem permissão e não encontrado |
| `Campo`, `CampoSenha`, `BotaoPrincipal`, `BotaoSecundario`, `BotaoTexto` | `src/componentes/Formulario.js` | Rótulo visível, erro anunciado pelo leitor de tela, mostrar/esconder senha |
| `CartaoMedico`, `CartaoConsulta`, `ChipSituacao`, `Estatistica`, `AvatarIniciais` | `src/componentes/Cartoes.js` | Listas e painel |
| `SeletorDia`, `GradeHoras`, `ChipsFiltro` | `src/componentes/Seletores.js` | Escolher dia e hora sem digitar |
| Avisos e confirmação | `src/contexto/Avisos.js` | Snackbar de sucesso e erro; diálogo próprio para ações destrutivas |
| `ErroGlobal` | `src/componentes/ErroGlobal.js` | Página de erro genérico se uma tela quebrar |

Prints das telas: [`docs/img/app`](img/app).
