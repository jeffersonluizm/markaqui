const path = require('path');

// Configuração lida do ambiente. DB_FILE permite apontar para outro banco (os
// testes e a carga usam um arquivo temporário).
const config = {
  porta: Number(process.env.PORT) || 3000,
  arquivoBanco: process.env.DB_FILE || path.join(__dirname, '..', 'dados', 'markaqui.db'),
};

module.exports = { config };
