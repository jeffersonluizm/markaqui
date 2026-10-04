// Regras da agenda: cada horário pertence a um médico.
const { gerarId } = require('../infra/ids');
const { naoEncontrado, requisicaoInvalida, conflito } = require('../erros');
const { validarEdicaoHorario } = require('../validators/horario');

const MSG_DUPLICADO = 'Este médico já tem um horário cadastrado nessa data e hora';
const MSG_AGENDADO = 'Este horário está agendado. Cancele o agendamento primeiro.';

// Agendado = tem agendamento apontando para ele (ou, em dado antigo, tem paciente).
function estaAgendado(r, horario) {
  return (
    r.agendamentos.existeParaHorario(horario.id) ||
    (!horario.disponivel && Boolean(horario.paciente_nome))
  );
}

function listar(r, medicoId) {
  return r.horarios.listar(medicoId);
}

function buscar(r, id) {
  const horario = r.horarios.buscar(id);
  if (!horario) throw naoEncontrado('Horário não encontrado');
  return horario;
}

// `novo` já validado por validarNovoHorario.
function cadastrar(r, novo) {
  const medico = r.medicos.buscar(novo.medico_id);
  if (!medico) throw requisicaoInvalida('Médico não encontrado');

  // Dois médicos podem ter o mesmo horário; o mesmo médico, não.
  if (r.horarios.existeIgual({ medicoId: medico.id, data: novo.data, hora: novo.hora })) {
    throw conflito(MSG_DUPLICADO);
  }
  return r.horarios.inserir({
    id: gerarId(),
    data: novo.data,
    hora: novo.hora,
    disponivel: novo.disponivel !== undefined ? novo.disponivel : true,
    paciente_nome: '',
    medico_id: medico.id,
    medico_nome: medico.nome,
  });
}

function atualizar(r, id, corpo) {
  const horario = buscar(r, id);
  const valores = validarEdicaoHorario(corpo);

  // Paciente e médico só mudam pelo agendamento; um horário agendado só é
  // liberado cancelando o agendamento.
  if (estaAgendado(r, horario)) throw conflito(MSG_AGENDADO);

  const atualizado = { ...horario, ...valores };
  const repetido =
    Boolean(atualizado.medico_id) &&
    r.horarios.existeIgual({
      medicoId: atualizado.medico_id,
      data: atualizado.data,
      hora: atualizado.hora,
      excetoId: horario.id,
    });
  if (repetido) throw conflito(MSG_DUPLICADO);

  return r.horarios.atualizar(id, valores);
}

function remover(r, id) {
  const horario = buscar(r, id);
  if (estaAgendado(r, horario)) throw conflito(MSG_AGENDADO);
  r.horarios.remover(id);
  return { mensagem: 'Horário removido com sucesso' };
}

module.exports = { listar, buscar, cadastrar, atualizar, remover };
