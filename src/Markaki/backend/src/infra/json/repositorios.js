// Repositórios sobre o documento JSON já carregado em memória. As alterações ficam
// no objeto `dados`; quem grava o arquivo é o armazenamento.
function criarRepositorios(dados) {
  const medicos = {
    listar: () => dados.medicos,
    buscar: (id) => dados.medicos.find((m) => m.id === id),
    inserir(medico) {
      dados.medicos.push(medico);
      return medico;
    },
    atualizar(id, campos) {
      const i = dados.medicos.findIndex((m) => m.id === id);
      dados.medicos[i] = { ...dados.medicos[i], ...campos };
      return dados.medicos[i];
    },
    remover(id) {
      dados.medicos = dados.medicos.filter((m) => m.id !== id);
    },
  };

  const horarios = {
    listar: (medicoId) =>
      medicoId ? dados.horarios.filter((h) => h.medico_id === medicoId) : dados.horarios,
    buscar: (id) => dados.horarios.find((h) => h.id === id),
    inserir(horario) {
      dados.horarios.push(horario);
      return horario;
    },
    atualizar(id, campos) {
      const i = dados.horarios.findIndex((h) => h.id === id);
      dados.horarios[i] = { ...dados.horarios[i], ...campos };
      return dados.horarios[i];
    },
    remover(id) {
      dados.horarios = dados.horarios.filter((h) => h.id !== id);
    },
    removerDoMedico(medicoId) {
      const antes = dados.horarios.length;
      dados.horarios = dados.horarios.filter((h) => h.medico_id !== medicoId);
      return antes - dados.horarios.length;
    },
    existeIgual: ({ medicoId, data, hora, excetoId }) =>
      dados.horarios.some(
        (h) => h.id !== excetoId && h.medico_id === medicoId && h.data === data && h.hora === hora
      ),
  };

  const agendamentos = {
    listar: () => dados.agendamentos,
    buscar: (id) => dados.agendamentos.find((a) => a.id === id),
    inserir(agendamento) {
      dados.agendamentos.push(agendamento);
      return agendamento;
    },
    remover(id) {
      dados.agendamentos = dados.agendamentos.filter((a) => a.id !== id);
    },
    contarDoMedico: (medicoId) => dados.agendamentos.filter((a) => a.medico_id === medicoId).length,
    existeParaHorario: (horarioId) => dados.agendamentos.some((a) => a.horario_id === horarioId),
  };

  return { medicos, horarios, agendamentos };
}

module.exports = { criarRepositorios };
