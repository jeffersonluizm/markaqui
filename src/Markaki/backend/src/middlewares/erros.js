const { ErroHttp } = require('../erros');

// Executa o handler e devolve { status, corpo } como JSON. Erros não previstos
// viram 500 com a mensagem padrão da rota (o detalhe nunca vai para o cliente).
function responder(mensagemPadrao, handler) {
  return async (req, res, next) => {
    try {
      const { status = 200, corpo } = await handler(req, res);
      res.status(status).json(corpo);
    } catch (erro) {
      erro.mensagemPadrao = mensagemPadrao;
      next(erro);
    }
  };
}

// eslint-disable-next-line no-unused-vars
function tratarErros(erro, req, res, next) {
  if (res.headersSent) return;
  if (erro instanceof ErroHttp) {
    res.status(erro.status).json({ erro: erro.message });
  } else if (erro.type === 'entity.parse.failed') {
    res.status(400).json({ erro: 'Corpo da requisição não é um JSON válido' });
  } else if (erro.type === 'entity.too.large') {
    res.status(413).json({ erro: 'Corpo da requisição grande demais' });
  } else {
    res.status(500).json({ erro: erro.mensagemPadrao || 'Erro interno' });
  }
}

module.exports = { responder, tratarErros };
