// Regras de agendamento: a paciente agenda para si mesma, o médico é sempre o dono
// do horário e cancelar não apaga (fica no histórico).
const { gerarId } = require('../infra/ids');
const { naoEncontrado, requisicaoInvalida, conflito } = require('../erros');
const { ehFuturo, momentoLocal } = require('../dominio/tempo');
const { agendamentoCom } = require('./apresentacao');
const horarios = require('./horarios');

function agendar(r, { horario_id, medico_id }, ctx) {
  const horario = horarios.buscar(r, horario_id);
  if (medico_id && medico_id !== horario.medico_id) {
    throw requisicaoInvalida('O horário escolhido não pertence a este médico.');
  }
  if (!ehFuturo(horario.data, horario.hora, ctx.agora)) throw requisicaoInvalida('Este horário já passou.');
  if (horario.bloqueado) throw conflito('Este horário não está disponível.');
  if (horario.agendado) throw conflito('Este horário acabou de ser reservado. Escolha outro.');
  const paciente = ctx.usuario;
  // Uma conta não reserva a agenda inteira (padrão: 3 consultas futuras ativas).
  const limite = ctx.config.limiteConsultasAtivas;
  if (r.agendamentos.contarFuturosDoPaciente(paciente.id, momentoLocal(ctx.agora)) >= limite) {
    throw conflito(`Você já tem ${limite} consultas marcadas. Cancele uma para agendar outra.`);
  }
  if (r.agendamentos.pacienteOcupado({ pacienteId: paciente.id, data: horario.data, hora: horario.hora })) {
    throw conflito('Você já tem uma consulta neste dia e horário.');
  }

  const agendamento = r.agendamentos.inserir({
    id: gerarId(),
    horario_id,
    medico_id: horario.medico_id,
    medico_nome: horario.medico_nome,
    medico_especialidade: horario.medico_especialidade,
    paciente_id: paciente.id,
    paciente_nome: paciente.nome,
    data: horario.data,
    hora: horario.hora,
    criado_em: ctx.agora.toISOString(),
  });
  return agendamentoCom(ctx.agora, agendamento);
}

// Paciente vê só os seus; gestor vê todos.
function listar(r, ctx) {
  const pacienteId = ctx.usuario.papel === 'gestor' ? undefined : ctx.usuario.id;
  return r.agendamentos.listar(pacienteId).map((a) => agendamentoCom(ctx.agora, a));
}

// Agendamento de outra paciente responde 404 (não revela que existe).
function buscarVisivel(r, id, ctx) {
  const agendamento = r.agendamentos.buscar(id);
  const visivel = agendamento && (ctx.usuario.papel === 'gestor' || agendamento.paciente_id === ctx.usuario.id);
  if (!visivel) throw naoEncontrado('Agendamento não encontrado.');
  return agendamento;
}

function detalhar(r, id, ctx) {
  return agendamentoCom(ctx.agora, buscarVisivel(r, id, ctx));
}

function cancelar(r, id, ctx) {
  const agendamento = buscarVisivel(r, id, ctx);
  if (agendamento.status === 'cancelado') throw conflito('Esta consulta já foi cancelada.');
  if (!ehFuturo(agendamento.data, agendamento.hora, ctx.agora)) {
    throw conflito('Não é possível cancelar uma consulta que já passou.');
  }
  const cancelado = r.agendamentos.cancelar(id, {
    cancelado_em: ctx.agora.toISOString(),
    cancelado_por: ctx.usuario.papel,
  });
  return agendamentoCom(ctx.agora, cancelado);
}

module.exports = { agendar, listar, detalhar, cancelar };
