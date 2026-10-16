const { texto } = require('./comum');

// A paciente só escolhe o horário (e, opcionalmente, confirma o médico). Quem é a
// paciente vem do token: paciente_id e paciente_nome do corpo são ignorados.
function validarNovoAgendamento(corpo) {
  return {
    horario_id: texto(corpo, 'horario_id', { rotulo: 'o horário' }),
    medico_id: texto(corpo, 'medico_id', { rotulo: 'o médico', opcional: true }),
  };
}

module.exports = { validarNovoAgendamento };
