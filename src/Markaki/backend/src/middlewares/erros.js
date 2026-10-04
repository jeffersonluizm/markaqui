const { ErroHttp } = require('../erros');

// Converte o erro em resposta. Erros não previstos viram 500 com a mensagem padrão
// da rota; o detalhe vai só para o log do servidor, nunca para o cliente.
function responderErro(res, erro, mensagemPadrao) {
  if (erro instanceof ErroHttp) {
    res.status(erro.status).json({ erro: erro.message });
  } else if (erro.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    // Última linha de defesa: o índice UNIQUE barrou o que a regra não pegou.
    res.status(409).json({ erro: 'Conflito com um registro que já existe.' });
  } else {
    console.error(`[erro] ${mensagemPadrao}:`, erro.code || '', erro.message);
    res.status(500).json({ erro: mensagemPadrao });
  }
}

// Rotas de leitura e escrita sobre o armazenamento. A operação recebe os
// repositórios, os dados já validados (antes de abrir a transação) e o contexto
// { usuario, agora, params, query }.
function criarManipuladores(armazenamento, config) {
  const contexto = (req) => ({
    config,
    usuario: req.usuario,
    agora: config.relogio(),
    params: req.params,
    query: req.query,
  });
  const executar = (mensagemPadrao, status, fn) => async (req, res) => {
    try {
      res.status(status).json(await fn(req));
    } catch (erro) {
      responderErro(res, erro, mensagemPadrao);
    }
  };
  return {
    executar,
    ler: (mensagemPadrao, operacao) =>
      executar(mensagemPadrao, 200, (req) => {
        const ctx = contexto(req);
        return armazenamento.leitura((r) => operacao(r, ctx));
      }),
    gravar: (mensagemPadrao, operacao, { status = 200, validar = () => undefined } = {}) =>
      executar(mensagemPadrao, status, (req) => {
        const dados = validar(req.body);
        const ctx = contexto(req);
        return armazenamento.escrita((r) => operacao(r, dados, ctx));
      }),
  };
}

// Erros que acontecem antes das rotas (corpo que não é JSON, corpo grande demais).
// eslint-disable-next-line no-unused-vars
function tratarErros(erro, req, res, next) {
  if (res.headersSent) return;
  if (erro.type === 'entity.parse.failed') {
    res.status(400).json({ erro: 'O corpo da requisição não é um JSON válido.' });
  } else if (erro.type === 'entity.too.large') {
    res.status(413).json({ erro: 'O corpo da requisição passa do limite de 10 KB.' });
  } else {
    responderErro(res, erro, 'Erro interno.');
  }
}

module.exports = { criarManipuladores, tratarErros, responderErro };
