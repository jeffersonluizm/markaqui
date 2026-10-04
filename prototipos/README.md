# Protótipos

Telas e experimentos feitos pela equipe durante o semestre, antes do app final. Ficavam soltos em `src/` e foram movidos para cá (com `git mv`, o histórico de cada arquivo continua no Git) para não serem confundidos com a aplicação.

**A aplicação entregue é `src/Markaki/`** (app Expo + API Express). Nada nesta pasta é usado por ela, e nenhum destes protótipos foi revisado ou corrigido: vários não rodam como estão.

| Pasta | O que é | Situação |
|---|---|---|
| `Home/` | Projeto Expo (exportado do Snack) com uma tela de agendamentos simples: formulário de cliente, serviço, data e hora, com lista que se edita e se apaga, gravada no `localStorage` do navegador. | Só funciona no navegador (usa `localStorage`). O `README.md` dela é o modelo genérico do curso. |
| `Login/` | Esboço de login. `app.js` monta a navegação (Login, Registro, Home) com React Navigation; o arquivo `welder fernandes de morais` (sem extensão) é o código JS da tela de login com a barra "Markaqui". | Incompleto: `app.js` importa `./screens/...`, que não existem, e não há `package.json`. |
| `marcacao/` | Projeto Expo (Snack) da tela de marcação: barra superior, informações do médico e lista de horários (`componets/`, `paginas/`). | Não roda como está: `App.js` importa `./src/paginas/homePage` e as páginas importam `../components/...`, mas as pastas se chamam `paginas/` e `componets/`. |
| `page_perfil/` | Projeto Expo (Snack) com a tela "Meu Perfil": tipo de conta, notificações, nome, cidade e telefone, salvos no `localStorage` quando roda na web. | Tela isolada, sem integração com a API. |
| `Sobre/` | App Expo Router ("markaquiapp", feito por Jefferson Luiz) com as telas institucionais e de fluxo: sobre, contrato, início, home, agendamento, cliente, profissional e perfil. Textos em `content.json`. | Protótipo de navegação e conteúdo; não usa a API do `src/Markaki`. |

Para abrir um protótipo que tenha `package.json`: entre na pasta, rode `npm install` e `npx expo start`.
