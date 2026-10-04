const { ErroHttp } = require('../erros');

// Converte o erro em resposta. Erros não previstos viram 500 com a mensagem padrão
// da rota (o detalhe nunca vai para o cliente).
function responderErro(res, erro, mensagemPadrao) {
  if (erro instanceof ErroHttp) {
    res.status(erro.status).json({ erro: erro.message });
  } else {
    res.status(500).json({ erro: mensagemPadrao });
  }
}

// Rotas de leitura e escrita sobre o armazenamento. `validar` roda antes de entrar
// na fila de escrita: corpo inválido não ocupa a fila nem lê os dados.
function criarManipuladores(armazenamento) {
  const executar = (mensagemPadrao, status, fn) => async (req, res) => {
    try {
      res.status(status).json(await fn(req));
    } catch (erro) {
      responderErro(res, erro, mensagemPadrao);
    }
  };
  return {
    ler: (mensagemPadrao, operacao) =>
      executar(mensagemPadrao, 200, (req) => armazenamento.leitura((r) => operacao(r, req))),
    gravar: (mensagemPadrao, operacao, { status = 200, validar = () => undefined } = {}) =>
      executar(mensagemPadrao, status, (req) => {
        const dados = validar(req.body);
        return armazenamento.escrita((r) => operacao(r, dados, req));
      }),
  };
}

// Erros que acontecem antes das rotas (corpo que não é JSON, corpo grande demais).
// eslint-disable-next-line no-unused-vars
function tratarErros(erro, req, res, next) {
  if (res.headersSent) return;
  if (erro.type === 'entity.parse.failed') {
    res.status(400).json({ erro: 'Corpo da requisição não é um JSON válido' });
  } else if (erro.type === 'entity.too.large') {
    res.status(413).json({ erro: 'Corpo da requisição grande demais' });
  } else {
    responderErro(res, erro, 'Erro interno');
  }
}

module.exports = { criarManipuladores, tratarErros };
