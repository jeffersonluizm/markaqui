const { requisicaoInvalida } = require('../erros');

// Únicos campos que a edição de horário aceita. Paciente e médico só mudam pelas
// rotas de agendamento.
const CAMPOS_EDITAVEIS_HORARIO = ['disponivel', 'data', 'hora'];

// Valida os campos editáveis presentes no corpo e devolve data e hora sem espaços
// nas pontas, para a checagem de duplicado não ser driblada.
function validarCamposHorario(corpo) {
  const valores = {};
  if ('disponivel' in corpo) {
    if (typeof corpo.disponivel !== 'boolean') {
      throw requisicaoInvalida('disponivel deve ser true ou false');
    }
    valores.disponivel = corpo.disponivel;
  }
  for (const campo of ['data', 'hora']) {
    if (!(campo in corpo)) continue;
    if (typeof corpo[campo] !== 'string' || !corpo[campo].trim()) {
      throw requisicaoInvalida(`${campo} deve ser um texto preenchido`);
    }
    valores[campo] = corpo[campo].trim();
  }
  return valores;
}

function validarNovoHorario(corpo) {
  const valores = validarCamposHorario(corpo);
  if (!valores.data || !valores.hora || !corpo.medico_id) {
    throw requisicaoInvalida('Médico, data e hora são obrigatórios');
  }
  return { ...valores, medico_id: corpo.medico_id };
}

function validarEdicaoHorario(corpo) {
  const naoEditaveis = Object.keys(corpo).filter((c) => !CAMPOS_EDITAVEIS_HORARIO.includes(c));
  if (naoEditaveis.length > 0) {
    throw requisicaoInvalida(
      `Campos não editáveis: ${naoEditaveis.join(', ')}. ` +
        `Só é possível alterar ${CAMPOS_EDITAVEIS_HORARIO.join(', ')}.`
    );
  }
  return validarCamposHorario(corpo);
}

module.exports = { validarNovoHorario, validarEdicaoHorario };
