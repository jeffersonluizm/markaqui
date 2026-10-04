// Ponto de entrada da API. A aplicação fica em src/ (rotas, serviços, validações e
// armazenamento em camadas); aqui só se escolhe o armazenamento e sobe o servidor.
const { config } = require('./src/config');
const { criarApp } = require('./src/app');
const { criarArmazenamentoSqlite } = require('./src/infra/sqlite/armazenamento');
const { gerarId } = require('./src/infra/ids');

const armazenamento = criarArmazenamentoSqlite(config.arquivoBanco);
const app = criarApp({ armazenamento });

// Só sobe o servidor quando executado direto (node server.js); os testes importam o app.
if (require.main === module) {
  app.listen(config.porta, () => {
    console.log(`Servidor rodando em http://localhost:${config.porta}/api`);
  });
}

module.exports = { app, gerarId, armazenamento };
