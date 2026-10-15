// Erro de regra de negócio com o status HTTP que a rota deve devolver.
class ErroHttp extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

const requisicaoInvalida = (mensagem) => new ErroHttp(400, mensagem);
const naoAutenticado = (mensagem = 'Faça login para continuar.') => new ErroHttp(401, mensagem);
const semPermissao = (mensagem = 'Você não tem permissão para esta ação.') => new ErroHttp(403, mensagem);
const naoEncontrado = (mensagem) => new ErroHttp(404, mensagem);
const conflito = (mensagem) => new ErroHttp(409, mensagem);
// 503 com Retry-After (segundos): o pedido é válido, mas agora não dá.
function indisponivel(mensagem, tenteEmSegundos) {
  const erro = new ErroHttp(503, mensagem);
  erro.cabecalhos = { 'Retry-After': String(Math.max(1, Math.ceil(tenteEmSegundos))) };
  return erro;
}

module.exports = { ErroHttp, requisicaoInvalida, naoAutenticado, semPermissao, naoEncontrado, conflito, indisponivel };
