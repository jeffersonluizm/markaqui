const { requisicaoInvalida } = require('../erros');
const { texto, somenteCampos } = require('./comum');

const NOME = { rotulo: 'o nome', min: 3, max: 80 };
const ESPECIALIDADE = { rotulo: 'a especialidade', min: 3, max: 60 };

function validarNovoMedico(corpo) {
  return { nome: texto(corpo, 'nome', NOME), especialidade: texto(corpo, 'especialidade', ESPECIALIDADE) };
}

function validarEdicaoMedico(corpo) {
  somenteCampos(corpo, ['nome', 'especialidade']);
  const dados = {
    nome: texto(corpo, 'nome', { ...NOME, opcional: true }),
    especialidade: texto(corpo, 'especialidade', { ...ESPECIALIDADE, opcional: true }),
  };
  if (!dados.nome && !dados.especialidade) throw requisicaoInvalida('Informe o que deseja alterar.');
  return dados;
}

module.exports = { validarNovoMedico, validarEdicaoMedico };
