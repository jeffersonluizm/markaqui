// Ponto de entrada da API. A aplicação fica em src/ (rotas, middlewares, serviços,
// validações e repositórios); aqui só se lê a configuração, abre o banco e sobe o
// servidor. Rode com "npm start" (carrega o .env desta pasta).
const { lerConfig } = require('./src/config');
const { criarApp } = require('./src/app');
const { criarArmazenamentoSqlite } = require('./src/infra/sqlite/armazenamento');
const { iniciarDemonstracao, resetarDemonstracao } = require('./src/services/demonstracao');

function iniciar(env = process.env) {
  const config = lerConfig(env);
  const armazenamento = criarArmazenamentoSqlite(config.arquivoBanco);
  const app = criarApp({ armazenamento, config });
  return { app, armazenamento, config };
}

// Modo demonstração: banco vazio (ex.: disco efêmero do Render) recebe o cenário de
// exemplo; e, com DEMO_RESET_MINUTOS, o cenário volta ao original de tempos em
// tempos (o que também apaga as pacientes efêmeras).
function ligarDemonstracao(armazenamento, config) {
  if (!config.demo.ativo) return;
  iniciarDemonstracao(armazenamento, config);
  if (config.demo.resetMinutos > 0) {
    setInterval(
      () => {
        try {
          resetarDemonstracao(armazenamento, config);
          console.log('[demo] dados de demonstração recriados');
        } catch (erro) {
          console.error('[demo] falha ao recriar os dados:', erro.message);
        }
      },
      config.demo.resetMinutos * 60 * 1000
    );
  }
  console.log(
    `[demo] modo demonstração ligado: paciente efêmera por visita (até ${config.demo.maxVisitantes}) e gestor ${config.demo.contas.gestor.email}`
  );
}

if (require.main === module) {
  try {
    const { app, armazenamento, config } = iniciar();
    ligarDemonstracao(armazenamento, config);
    app.listen(config.porta, config.host, () => {
      console.log(`API do Markaqui em http://${config.host}:${config.porta}/api`);
    });
  } catch (erro) {
    console.error(erro.message);
    process.exitCode = 1;
  }
}

module.exports = { iniciar };
