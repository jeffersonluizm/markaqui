const path = require('path');

// Configuração lida do ambiente. DATA_FILE permite apontar para outro arquivo
// (os testes e a carga usam um arquivo temporário).
const config = {
  porta: Number(process.env.PORT) || 3000,
  arquivoDados: process.env.DATA_FILE || path.join(__dirname, '..', 'database.json'),
};

module.exports = { config };
