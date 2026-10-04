const crypto = require('crypto');

// UUID: Date.now() repetia o id quando dois cadastros caíam no mesmo milissegundo.
function gerarId() {
  return crypto.randomUUID();
}

module.exports = { gerarId };
