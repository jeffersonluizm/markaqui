// Regras de médicos. Recebem os repositórios (r), dados já validados e o contexto
// da requisição (ctx: usuário e "agora").
const { gerarId } = require('../infra/ids');
const { naoEncontrado, conflito } = require('../erros');
const { momentoLocal } = require('../dominio/tempo');

function buscar(r, id) {
  const medico = r.medicos.buscar(id);
  if (!medico) throw naoEncontrado('Médico não encontrado.');
  return medico;
}

function cadastrar(r, { nome, especialidade }) {
  return r.medicos.inserir({ id: gerarId(), nome, especialidade });
}

// O nome novo vale para a agenda e para as consultas futuras; o histórico de
// consultas canceladas ou realizadas guarda o nome da época.
function atualizar(r, id, campos, ctx) {
  buscar(r, id);
  const medico = r.medicos.atualizar(id, campos);
  r.agendamentos.renomearMedicoNosAtivos(id, medico, momentoLocal(ctx.agora));
  return medico;
}

// Com consulta futura marcada o médico não sai. Sem ela, a agenda dele sai junto
// e o histórico de consultas continua (com o nome copiado no agendamento).
function remover(r, id, ctx) {
  buscar(r, id);
  const futuras = r.agendamentos.contarFuturosDoMedico(id, momentoLocal(ctx.agora));
  if (futuras > 0) {
    throw conflito(`Este médico tem ${futuras} consulta(s) marcada(s). Cancele as consultas primeiro.`);
  }
  const horariosRemovidos = r.horarios.removerDoMedico(id);
  r.medicos.remover(id);
  return { mensagem: 'Médico removido.', horarios_removidos: horariosRemovidos };
}

module.exports = { buscar, cadastrar, atualizar, remover };
