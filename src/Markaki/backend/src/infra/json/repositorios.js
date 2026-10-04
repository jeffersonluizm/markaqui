// Repositórios sobre o documento JSON já carregado em memória. As alterações ficam
// no objeto `dados`; quem grava o arquivo é o armazenamento.

// Operações comuns a toda coleção do documento.
function colecao(dados, nome) {
  return {
    listar: () => dados[nome],
    buscar: (id) => dados[nome].find((item) => item.id === id),
    inserir(item) {
      dados[nome].push(item);
      return item;
    },
    // Devolve o item atualizado, ou undefined se o id não existe (como um UPDATE sem linhas).
    atualizar(id, campos) {
      const i = dados[nome].findIndex((item) => item.id === id);
      if (i === -1) return undefined;
      dados[nome][i] = { ...dados[nome][i], ...campos };
      return dados[nome][i];
    },
    remover(id) {
      dados[nome] = dados[nome].filter((item) => item.id !== id);
    },
  };
}

function criarRepositorios(dados) {
  const horarios = colecao(dados, 'horarios');
  const agendamentos = colecao(dados, 'agendamentos');
  return {
    medicos: colecao(dados, 'medicos'),
    horarios: {
      ...horarios,
      listar: (medicoId) =>
        medicoId ? dados.horarios.filter((h) => h.medico_id === medicoId) : dados.horarios,
      removerDoMedico(medicoId) {
        const antes = dados.horarios.length;
        dados.horarios = dados.horarios.filter((h) => h.medico_id !== medicoId);
        return antes - dados.horarios.length;
      },
      existeIgual: ({ medicoId, data, hora, excetoId }) =>
        dados.horarios.some(
          (h) => h.id !== excetoId && h.medico_id === medicoId && h.data === data && h.hora === hora
        ),
    },
    agendamentos: {
      ...agendamentos,
      contarDoMedico: (medicoId) =>
        dados.agendamentos.filter((a) => a.medico_id === medicoId).length,
      existeParaHorario: (horarioId) => dados.agendamentos.some((a) => a.horario_id === horarioId),
    },
  };
}

module.exports = { criarRepositorios };
