// Autenticação por token Bearer e autorização por papel.
const { verificarToken } = require('../infra/tokens');
const { naoAutenticado, semPermissao } = require('../erros');
const { responderErro } = require('./erros');
const { usuarioPublico } = require('../services/apresentacao');

// Confere o token e carrega o usuário do banco: o papel usado na autorização é o
// do banco (um token antigo não guarda privilégio que a pessoa já não tem).
function autenticar(armazenamento, config) {
  return async (req, res, next) => {
    try {
      const [tipo, token] = (req.get('authorization') || '').split(' ');
      if (tipo !== 'Bearer' || !token) throw naoAutenticado();
      let conteudo;
      try {
        conteudo = verificarToken(token, config.jwtSegredo);
      } catch (erro) {
        throw erro.name === 'TokenExpiredError'
          ? naoAutenticado('Sua sessão expirou. Entre novamente.')
          : naoAutenticado();
      }
      const usuario = await armazenamento.leitura((r) => r.usuarios.buscar(conteudo.sub));
      if (!usuario) throw naoAutenticado();
      req.usuario = usuarioPublico(usuario);
      next();
    } catch (erro) {
      responderErro(res, erro, 'Erro ao conferir a sessão.');
    }
  };
}

function exigirPapel(...papeis) {
  return (req, res, next) => {
    if (papeis.includes(req.usuario.papel)) return next();
    return responderErro(res, semPermissao(), '');
  };
}

module.exports = { autenticar, exigirPapel };
