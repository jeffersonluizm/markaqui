// Resumo para o gestor: consultas de hoje e da semana, horários livres e médicos.
const { momentoLocal, somarDias } = require('../dominio/tempo');
const { agendamentoCom } = require('./apresentacao');

function resumo(r, ctx) {
  const agora = momentoLocal(ctx.agora);
  const semana = r.agendamentos.ativosEntre(agora.data, somarDias(agora.data, 6));
  const hoje = semana.filter((a) => a.data === agora.data);
  return {
    consultas_hoje: hoje.length,
    consultas_7_dias: semana.length,
    horarios_livres: r.horarios.contarLivres(agora),
    medicos: r.medicos.contar(),
    agenda_de_hoje: hoje.map((a) => agendamentoCom(ctx.agora, a)),
  };
}

module.exports = { resumo };
