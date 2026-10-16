const { requisicaoInvalida } = require('../erros');
const { texto, booleano, somenteCampos } = require('./comum');
const { dataValida, horaValida } = require('../dominio/tempo');

function data(corpo, opcional = false) {
  const valor = texto(corpo, 'data', { rotulo: 'a data', opcional });
  if (valor !== undefined && !dataValida(valor)) {
    throw requisicaoInvalida('Informe uma data real no formato AAAA-MM-DD.');
  }
  return valor;
}

function hora(corpo, opcional = false) {
  const valor = texto(corpo, 'hora', { rotulo: 'a hora', opcional });
  if (valor !== undefined && !horaValida(valor)) {
    throw requisicaoInvalida('Informe a hora no formato HH:MM (00:00 a 23:59).');
  }
  return valor;
}

function validarNovoHorario(corpo) {
  return {
    medico_id: texto(corpo, 'medico_id', { rotulo: 'o médico' }),
    data: data(corpo),
    hora: hora(corpo),
    bloqueado: booleano(corpo, 'bloqueado') ?? false,
  };
}

// Edição: só bloqueado, data e hora. Médico e paciente nunca mudam por aqui.
function validarEdicaoHorario(corpo) {
  somenteCampos(corpo, ['bloqueado', 'data', 'hora']);
  const dados = { bloqueado: booleano(corpo, 'bloqueado'), data: data(corpo, true), hora: hora(corpo, true) };
  if (Object.values(dados).every((v) => v === undefined)) throw requisicaoInvalida('Informe o que deseja alterar.');
  return dados;
}

module.exports = { validarNovoHorario, validarEdicaoHorario };
