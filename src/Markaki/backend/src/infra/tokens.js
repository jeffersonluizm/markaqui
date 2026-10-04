// Token de sessão: JWT HS256 com o id do usuário (sub). O papel vai no token só
// como informação; a autorização usa sempre o papel lido do banco.
const jwt = require('jsonwebtoken');

function emitirToken(usuario, { segredo, validade }) {
  return jwt.sign({ papel: usuario.papel }, segredo, {
    subject: usuario.id,
    expiresIn: validade,
    algorithm: 'HS256',
  });
}

// Devolve o conteúdo do token ou lança o erro do jsonwebtoken
// (TokenExpiredError quando venceu).
function verificarToken(token, segredo) {
  return jwt.verify(token, segredo, { algorithms: ['HS256'] });
}

module.exports = { emitirToken, verificarToken };
