const path = require('path');

const caminhoBanco = (env = process.env) =>
  env.DB_FILE || path.join(__dirname, '..', 'dados', 'markaqui.db');

// Configuração lida do ambiente (arquivo .env ao lado do server.js; modelo em
// .env.example). Sem JWT_SECRET forte a API não sobe.
function lerConfig(env = process.env) {
  const segredo = env.JWT_SECRET || '';
  if (segredo.length < 32) {
    throw new Error(
      'Defina JWT_SECRET com pelo menos 32 caracteres no arquivo .env do backend ' +
        '(veja .env.example; o iniciar.bat cria um automaticamente).'
    );
  }
  const numero = (valor, padrao) => (valor === undefined || valor === '' ? padrao : Number(valor));
  return {
    porta: numero(env.PORT, 3000),
    arquivoBanco: caminhoBanco(env),
    jwtSegredo: segredo,
    jwtValidade: env.JWT_VALIDADE || '8h',
    bcryptCusto: numero(env.BCRYPT_CUSTO, 10),
    corsOrigens: (env.CORS_ORIGENS || 'http://localhost:8081,http://localhost:19006')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    // Tentativas de login/cadastro por IP por minuto; e requisições por IP por minuto (0 desliga).
    limiteAuthMax: numero(env.LIMITE_AUTH_POR_MINUTO, 5),
    limiteGlobalMax: numero(env.LIMITE_GLOBAL_POR_MINUTO, 300),
    relogio: () => new Date(),
  };
}

module.exports = { lerConfig, caminhoBanco };
