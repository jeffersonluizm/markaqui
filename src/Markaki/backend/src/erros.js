// Erro de regra de negócio com o status HTTP que a rota deve devolver.
class ErroHttp extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

const naoEncontrado = (mensagem) => new ErroHttp(404, mensagem);
const requisicaoInvalida = (mensagem) => new ErroHttp(400, mensagem);
const conflito = (mensagem) => new ErroHttp(409, mensagem);

module.exports = { ErroHttp, naoEncontrado, requisicaoInvalida, conflito };
