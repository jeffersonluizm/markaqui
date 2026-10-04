// Regras de agendamento: o médico da consulta é sempre o dono do horário.
const { gerarId } = require('../infra/ids');
const { naoEncontrado, requisicaoInvalida } = require('../erros');
const horarios = require('./horarios');
const medicos = require('./medicos');

function agendar(r, { horario_id, medico_id, paciente_nome }) {
  const horario = horarios.buscar(r, horario_id);
  if (!horario.disponivel) throw requisicaoInvalida('Horário não está disponível');

  // Horário antigo sem médico (de antes da agenda por médico) não pode ser agendado.
  if (!horario.medico_id) {
    throw requisicaoInvalida(
      'Este horário não tem médico. Cadastre o horário na agenda de um médico.'
    );
  }
  if (medico_id && medico_id !== horario.medico_id) {
    throw requisicaoInvalida('O horário escolhido não pertence a este médico');
  }
  const medico = medicos.buscar(r, horario.medico_id);

  const agendamento = r.agendamentos.inserir({
    id: gerarId(),
    horario_id,
    medico_id: medico.id,
    medico_nome: medico.nome,
    medico_especialidade: medico.especialidade,
    paciente_nome,
    data: horario.data,
    hora: horario.hora,
    status: 'agendado',
    criado_em: new Date().toISOString(),
  });
  r.horarios.atualizar(horario_id, { disponivel: false, paciente_nome });
  return agendamento;
}

// Libera o horário (ele continua na agenda do mesmo médico) e remove o agendamento.
function cancelar(r, id) {
  const agendamento = r.agendamentos.buscar(id);
  if (!agendamento) throw naoEncontrado('Agendamento não encontrado');
  r.horarios.atualizar(agendamento.horario_id, { disponivel: true, paciente_nome: '' });
  r.agendamentos.remover(id);
  return { mensagem: 'Agendamento cancelado com sucesso' };
}

module.exports = { agendar, cancelar };
