// Regras da agenda: cada horário pertence a um médico; só o gestor altera.
const { gerarId } = require('../infra/ids');
const { naoEncontrado, requisicaoInvalida, conflito } = require('../erros');
const { ehFuturo, momentoLocal } = require('../dominio/tempo');
const { horarioPara } = require('./apresentacao');

const MSG_DUPLICADO = 'Este médico já tem um horário nessa data e hora.';
const MSG_AGENDADO = 'Este horário tem consulta marcada. Cancele a consulta primeiro.';
const MSG_PASSADO = 'Escolha uma data e hora no futuro.';

function buscar(r, id) {
  const horario = r.horarios.buscar(id);
  if (!horario) throw naoEncontrado('Horário não encontrado.');
  return horario;
}

// Paciente vê só horários livres e futuros; gestor vê a agenda completa.
function listar(r, medicoId, ctx) {
  const lista =
    ctx.usuario.papel === 'gestor'
      ? r.horarios.listar(medicoId)
      : r.horarios.listarLivres(medicoId, momentoLocal(ctx.agora));
  return lista.map((h) => horarioPara(ctx.usuario, h));
}

function detalhar(r, id, ctx) {
  const horario = buscar(r, id);
  const paraPaciente = ctx.usuario.papel !== 'gestor';
  if (paraPaciente && (!horario.disponivel || !ehFuturo(horario.data, horario.hora, ctx.agora))) {
    throw naoEncontrado('Horário não encontrado.');
  }
  return horarioPara(ctx.usuario, horario);
}

function cadastrar(r, novo, ctx) {
  if (!r.medicos.buscar(novo.medico_id)) throw requisicaoInvalida('Médico não encontrado.');
  if (!ehFuturo(novo.data, novo.hora, ctx.agora)) throw requisicaoInvalida(MSG_PASSADO);
  // Dois médicos podem ter o mesmo horário; o mesmo médico, não.
  if (r.horarios.existeIgual({ medicoId: novo.medico_id, data: novo.data, hora: novo.hora })) {
    throw conflito(MSG_DUPLICADO);
  }
  return horarioPara(ctx.usuario, r.horarios.inserir({ id: gerarId(), ...novo }));
}

// Bloquear, desbloquear ou mudar data e hora. Horário com consulta marcada só é
// liberado cancelando a consulta.
function atualizar(r, id, campos, ctx) {
  const horario = buscar(r, id);
  if (horario.agendado) throw conflito(MSG_AGENDADO);

  const data = campos.data ?? horario.data;
  const hora = campos.hora ?? horario.hora;
  const mudouMomento = data !== horario.data || hora !== horario.hora;
  if (mudouMomento) {
    if (!ehFuturo(data, hora, ctx.agora)) throw requisicaoInvalida(MSG_PASSADO);
    if (r.horarios.existeIgual({ medicoId: horario.medico_id, data, hora, excetoId: id })) {
      throw conflito(MSG_DUPLICADO);
    }
  }
  return horarioPara(ctx.usuario, r.horarios.atualizar(id, campos));
}

function remover(r, id) {
  const horario = buscar(r, id);
  if (horario.agendado) throw conflito(MSG_AGENDADO);
  r.horarios.remover(id);
  return { mensagem: 'Horário removido.' };
}

module.exports = { buscar, listar, detalhar, cadastrar, atualizar, remover };
