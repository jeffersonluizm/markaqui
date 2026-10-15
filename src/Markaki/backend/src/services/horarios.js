// Regras da agenda: cada horário pertence a um médico; só o gestor altera.
const { gerarId } = require('../infra/ids');
const { naoEncontrado, requisicaoInvalida, conflito } = require('../erros');
const { ehFuturo, momentoLocal } = require('../dominio/tempo');
const { horarioPara } = require('./apresentacao');
const { protegerCenario, respeitarTeto, limitarJanela, limitarBloqueio } = require('./protecaoDemo');

const MSG_DUPLICADO = 'Este médico já tem um horário nessa data e hora.';
const MSG_AGENDADO = 'Este horário tem consulta marcada. Cancele a consulta primeiro.';
const MSG_REALIZADO =
  'A consulta deste horário já aconteceu. Ele fica no histórico e não pode ser alterado nem removido.';
const MSG_PASSADO = 'Escolha uma data e hora no futuro.';

// Horário com consulta ativa: se ela ainda vai acontecer, dá para cancelar antes;
// se já aconteceu, o horário é histórico.
function exigirSemConsulta(horario, ctx) {
  if (!horario.agendado) return;
  throw conflito(ehFuturo(horario.data, horario.hora, ctx.agora) ? MSG_AGENDADO : MSG_REALIZADO);
}

function buscar(r, id) {
  const horario = r.horarios.buscar(id);
  if (!horario) throw naoEncontrado('Horário não encontrado.');
  return horario;
}

// Paciente vê só horários livres e futuros; gestor vê a agenda completa.
function listar(r, medicoId, ctx) {
  const limite = ctx.config.limiteListagem;
  const lista =
    ctx.usuario.papel === 'gestor'
      ? r.horarios.listar(medicoId, limite)
      : r.horarios.listarLivres(medicoId, momentoLocal(ctx.agora), limite);
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
  limitarJanela(ctx, novo.data);
  respeitarTeto(ctx, { atual: r.horarios.contarCriados(), chave: 'maxHorarios', rotulo: 'horários' });
  if (!ehFuturo(novo.data, novo.hora, ctx.agora)) throw requisicaoInvalida(MSG_PASSADO);
  // Dois médicos podem ter o mesmo horário; o mesmo médico, não.
  if (r.horarios.existeIgual({ medicoId: novo.medico_id, data: novo.data, hora: novo.hora })) {
    throw conflito(MSG_DUPLICADO);
  }
  return horarioPara(ctx.usuario, r.horarios.inserir({ id: gerarId(), ...novo }));
}

// Bloquear, desbloquear ou mudar data e hora. Horário com consulta marcada só é
// liberado cancelando a consulta (se ela ainda não aconteceu).
function atualizar(r, id, campos, ctx) {
  const horario = buscar(r, id);
  exigirSemConsulta(horario, ctx);
  limitarBloqueio(ctx, r, horario, campos);

  const data = campos.data ?? horario.data;
  const hora = campos.hora ?? horario.hora;
  const mudouMomento = data !== horario.data || hora !== horario.hora;
  if (mudouMomento) {
    protegerCenario(ctx, 'horario', id);
    limitarJanela(ctx, data);
    if (!ehFuturo(data, hora, ctx.agora)) throw requisicaoInvalida(MSG_PASSADO);
    if (r.horarios.existeIgual({ medicoId: horario.medico_id, data, hora, excetoId: id })) {
      throw conflito(MSG_DUPLICADO);
    }
  }
  return horarioPara(ctx.usuario, r.horarios.atualizar(id, campos));
}

function remover(r, id, ctx) {
  const horario = buscar(r, id);
  protegerCenario(ctx, 'horario', id);
  exigirSemConsulta(horario, ctx);
  r.horarios.remover(id);
  return { mensagem: 'Horário removido.' };
}

module.exports = { buscar, listar, detalhar, cadastrar, atualizar, remover };
