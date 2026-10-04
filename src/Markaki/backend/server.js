// Ponto de entrada da API. A aplicação fica em src/ (rotas, middlewares, serviços,
// validações e repositórios); aqui só se lê a configuração, abre o banco e sobe o
// servidor. Rode com "npm start" (carrega o .env desta pasta).
const { lerConfig } = require('./src/config');
const { criarApp } = require('./src/app');
const { criarArmazenamentoSqlite } = require('./src/infra/sqlite/armazenamento');

function iniciar(env = process.env) {
  const config = lerConfig(env);
  const armazenamento = criarArmazenamentoSqlite(config.arquivoBanco);
  const app = criarApp({ armazenamento, config });
  return { app, armazenamento, config };
}

if (require.main === module) {
  try {
    const { app, config } = iniciar();
    // 0.0.0.0: o celular na mesma rede Wi-Fi precisa alcançar a API pelo IP da máquina.
    app.listen(config.porta, '0.0.0.0', () => {
      console.log(`API do Markaqui em http://localhost:${config.porta}/api`);
    });
  } catch (erro) {
    console.error(erro.message);
    process.exitCode = 1;
  }
}

module.exports = { iniciar };
