// Repositórios sobre o SQLite (better-sqlite3, síncrono). As consultas são
// preparadas uma vez por conexão. O nome do médico do horário vem por JOIN, então
// renomear o médico já aparece na agenda dele.

const SELECT_HORARIO = `
  SELECT h.id, h.data, h.hora, h.disponivel, h.paciente_nome, h.medico_id,
         COALESCE(m.nome, '') AS medico_nome
  FROM horarios h LEFT JOIN medicos m ON m.id = h.medico_id`;

const paraHorario = (linha) => linha && { ...linha, disponivel: Boolean(linha.disponivel) };

// Converte valores de JS para o SQLite (booleanos viram 0/1).
const paraBanco = (valor) => (typeof valor === 'boolean' ? Number(valor) : valor);

// UPDATE só com as colunas permitidas (os nomes nunca vêm do cliente sem filtro).
function atualizador(db, tabela, colunas) {
  const cache = new Map();
  return (id, campos) => {
    const nomes = Object.keys(campos).filter((c) => colunas.includes(c) && campos[c] !== undefined);
    if (nomes.length === 0) return 0;
    const chave = nomes.join(',');
    if (!cache.has(chave)) {
      cache.set(
        chave,
        db.prepare(`UPDATE ${tabela} SET ${nomes.map((c) => `${c} = @${c}`).join(', ')} WHERE id = @id`)
      );
    }
    const valores = { id };
    for (const c of nomes) valores[c] = paraBanco(campos[c]);
    return cache.get(chave).run(valores).changes;
  };
}

function criarRepositorios(db) {
  const q = {
    medicosListar: db.prepare('SELECT id, nome, especialidade, imagem FROM medicos ORDER BY rowid'),
    medicoBuscar: db.prepare('SELECT id, nome, especialidade, imagem FROM medicos WHERE id = ?'),
    medicoInserir: db.prepare(
      'INSERT INTO medicos (id, nome, especialidade, imagem) VALUES (@id, @nome, @especialidade, @imagem)'
    ),
    medicoRemover: db.prepare('DELETE FROM medicos WHERE id = ?'),

    horariosListar: db.prepare(`${SELECT_HORARIO} ORDER BY h.data, h.hora, h.rowid`),
    horariosDoMedico: db.prepare(`${SELECT_HORARIO} WHERE h.medico_id = ? ORDER BY h.data, h.hora`),
    horarioBuscar: db.prepare(`${SELECT_HORARIO} WHERE h.id = ?`),
    horarioInserir: db.prepare(`
      INSERT INTO horarios (id, medico_id, data, hora, disponivel, paciente_nome)
      VALUES (@id, @medico_id, @data, @hora, @disponivel, @paciente_nome)`),
    horarioRemover: db.prepare('DELETE FROM horarios WHERE id = ?'),
    horariosRemoverDoMedico: db.prepare('DELETE FROM horarios WHERE medico_id = ?'),
    horarioIgual: db.prepare(`
      SELECT 1 FROM horarios
      WHERE medico_id = @medicoId AND data = @data AND hora = @hora AND id <> @excetoId`),

    agendamentosListar: db.prepare('SELECT * FROM agendamentos ORDER BY rowid'),
    agendamentoBuscar: db.prepare('SELECT * FROM agendamentos WHERE id = ?'),
    agendamentoInserir: db.prepare(`
      INSERT INTO agendamentos (id, horario_id, medico_id, medico_nome, medico_especialidade,
        paciente_nome, data, hora, status, criado_em)
      VALUES (@id, @horario_id, @medico_id, @medico_nome, @medico_especialidade,
        @paciente_nome, @data, @hora, @status, @criado_em)`),
    agendamentoRemover: db.prepare('DELETE FROM agendamentos WHERE id = ?'),
    agendamentosContarDoMedico: db.prepare('SELECT COUNT(*) AS n FROM agendamentos WHERE medico_id = ?'),
    agendamentoDoHorario: db.prepare('SELECT 1 FROM agendamentos WHERE horario_id = ? LIMIT 1'),
  };
  const atualizarMedico = atualizador(db, 'medicos', ['nome', 'especialidade', 'imagem']);
  const atualizarHorario = atualizador(db, 'horarios', ['data', 'hora', 'disponivel', 'paciente_nome']);

  const medicos = {
    listar: () => q.medicosListar.all(),
    buscar: (id) => q.medicoBuscar.get(id),
    inserir(medico) {
      q.medicoInserir.run({ imagem: '', ...medico });
      return medicos.buscar(medico.id);
    },
    // Devolve o médico atualizado, ou undefined se o id não existe.
    atualizar(id, campos) {
      atualizarMedico(id, campos);
      return medicos.buscar(id);
    },
    remover: (id) => q.medicoRemover.run(id),
  };

  const horarios = {
    listar: (medicoId) =>
      (medicoId ? q.horariosDoMedico.all(medicoId) : q.horariosListar.all()).map(paraHorario),
    buscar: (id) => paraHorario(q.horarioBuscar.get(id)),
    inserir(horario) {
      q.horarioInserir.run({
        id: horario.id,
        medico_id: horario.medico_id ?? null,
        data: horario.data,
        hora: horario.hora,
        disponivel: paraBanco(horario.disponivel ?? true),
        paciente_nome: horario.paciente_nome || '',
      });
      return horarios.buscar(horario.id);
    },
    atualizar(id, campos) {
      atualizarHorario(id, campos);
      return horarios.buscar(id);
    },
    remover: (id) => q.horarioRemover.run(id),
    removerDoMedico: (medicoId) => q.horariosRemoverDoMedico.run(medicoId).changes,
    existeIgual: ({ medicoId, data, hora, excetoId }) =>
      Boolean(q.horarioIgual.get({ medicoId, data, hora, excetoId: excetoId ?? '' })),
  };

  const agendamentos = {
    listar: () => q.agendamentosListar.all(),
    buscar: (id) => q.agendamentoBuscar.get(id),
    inserir(agendamento) {
      q.agendamentoInserir.run({
        horario_id: null,
        medico_id: null,
        medico_nome: '',
        medico_especialidade: '',
        paciente_nome: '',
        data: '',
        hora: '',
        status: 'agendado',
        criado_em: new Date().toISOString(),
        ...agendamento,
      });
      return agendamentos.buscar(agendamento.id);
    },
    remover: (id) => q.agendamentoRemover.run(id),
    contarDoMedico: (medicoId) => q.agendamentosContarDoMedico.get(medicoId).n,
    existeParaHorario: (horarioId) => Boolean(q.agendamentoDoHorario.get(horarioId)),
  };

  return { medicos, horarios, agendamentos };
}

module.exports = { criarRepositorios };
