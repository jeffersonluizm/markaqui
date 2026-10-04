const { requisicaoInvalida } = require('../erros');

function validarNovoAgendamento({ horario_id, medico_id, paciente_nome }) {
  if (!horario_id || !paciente_nome) {
    throw requisicaoInvalida('Horário e nome do paciente são obrigatórios');
  }
  return { horario_id, medico_id, paciente_nome };
}

module.exports = { validarNovoAgendamento };
