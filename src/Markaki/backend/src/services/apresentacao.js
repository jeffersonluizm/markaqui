// O que cada papel enxerga. A paciente nunca recebe dados de outra pessoa nem o
// hash da senha de ninguém.
const { chave, momentoLocal } = require('../dominio/tempo');

function usuarioPublico({ id, nome, email, telefone, papel, criado_em, demo }) {
  return { id, nome, email, telefone, papel, criado_em, demo: Boolean(demo) };
}

function horarioParaPaciente(h) {
  const { id, medico_id, medico_nome, medico_especialidade, data, hora, disponivel } = h;
  return { id, medico_id, medico_nome, medico_especialidade, data, hora, disponivel };
}

function horarioParaGestor(h) {
  const { paciente_id, ...resto } = h;
  return resto;
}

const horarioPara = (usuario, h) =>
  usuario.papel === 'gestor' ? horarioParaGestor(h) : horarioParaPaciente(h);

// Situação para a tela: agendado, cancelado ou realizado (agendado que já passou).
function agendamentoCom(agora, a) {
  let situacao = a.status;
  if (a.status === 'agendado' && chave(a.data, a.hora) <= momentoLocal(agora).chave) {
    situacao = 'realizado';
  }
  return { ...a, situacao };
}

module.exports = { usuarioPublico, horarioPara, agendamentoCom };
