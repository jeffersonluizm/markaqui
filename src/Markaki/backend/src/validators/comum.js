// Peças de validação compartilhadas. Todas lançam 400 com mensagem para a pessoa.
const { requisicaoInvalida } = require('../erros');

// Texto obrigatório (ou opcional) com tamanho mínimo e máximo depois do trim.
function texto(corpo, campo, { rotulo = campo, min = 1, max = 200, opcional = false } = {}) {
  const valor = corpo[campo];
  if (valor === undefined || valor === null || valor === '') {
    if (opcional) return undefined;
    throw requisicaoInvalida(`Informe ${rotulo}.`);
  }
  if (typeof valor !== 'string') throw requisicaoInvalida(`${rotulo} deve ser um texto.`);
  const limpo = valor.trim();
  if (limpo.length < min) throw requisicaoInvalida(`${rotulo} precisa de pelo menos ${min} caracteres.`);
  if (limpo.length > max) throw requisicaoInvalida(`${rotulo} pode ter no máximo ${max} caracteres.`);
  return limpo;
}

function booleano(corpo, campo) {
  if (!(campo in corpo)) return undefined;
  if (typeof corpo[campo] !== 'boolean') throw requisicaoInvalida(`${campo} deve ser true ou false.`);
  return corpo[campo];
}

// Recusa campos fora da lista (evita que o cliente tente mudar o que não pode).
function somenteCampos(corpo, permitidos) {
  const extras = Object.keys(corpo).filter((c) => !permitidos.includes(c));
  if (extras.length > 0) {
    throw requisicaoInvalida(
      `Campos não editáveis: ${extras.join(', ')}. Só é possível alterar ${permitidos.join(', ')}.`
    );
  }
}

module.exports = { texto, booleano, somenteCampos };
