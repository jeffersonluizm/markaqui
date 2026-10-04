const { requisicaoInvalida } = require('../erros');

function validarNovoMedico({ nome, especialidade, imagem }) {
  if (!nome || !especialidade) {
    throw requisicaoInvalida('Nome e especialidade são obrigatórios');
  }
  return { nome, especialidade, imagem };
}

// Na edição, campo vazio ou ausente mantém o valor atual.
function validarEdicaoMedico({ nome, especialidade, imagem }) {
  return { nome, especialidade, imagem };
}

module.exports = { validarNovoMedico, validarEdicaoMedico };
