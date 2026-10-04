// Repositórios sobre o SQLite (better-sqlite3, síncrono). As consultas são
// preparadas uma vez por conexão. O estado do horário (livre, bloqueado ou
// agendado) é calculado na consulta, a partir do agendamento ativo: não há
// coluna "disponivel" para ficar fora de sincronia.

const SELECT_HORARIO = `
  SELECT h.id, h.medico_id, m.nome AS medico_nome, m.especialidade AS medico_especialidade,
         h.data, h.hora, h.bloqueado, a.id AS agendamento_id, a.paciente_id, a.paciente_nome
  FROM horarios h
  JOIN medicos m ON m.id = h.medico_id
  LEFT JOIN agendamentos a ON a.horario_id = h.id AND a.status = 'agendado'`;

// "Depois de agora" sem concatenar colunas, para o SQLite poder usar os índices.
const DEPOIS_DE = '(h.data > @data OR (h.data = @data AND h.hora > @hora))';
const LIVRE = 'h.bloqueado = 0 AND a.id IS NULL';

function paraHorario(linha) {
  if (!linha) return undefined;
  const bloqueado = Boolean(linha.bloqueado);
  const agendado = Boolean(linha.agendamento_id);
  return { ...linha, bloqueado, agendado, disponivel: !bloqueado && !agendado };
}

// UPDATE só com as colunas permitidas (os nomes nunca vêm do cliente sem filtro).
function atualizador(db, tabela, colunas) {
  const cache = new Map();
  return (id, campos) => {
    const nomes = colunas.filter((c) => campos[c] !== undefined);
    if (nomes.length === 0) return 0;
    const chave = nomes.join(',');
    if (!cache.has(chave)) {
      const sets = nomes.map((c) => `${c} = @${c}`).join(', ');
      cache.set(chave, db.prepare(`UPDATE ${tabela} SET ${sets} WHERE id = @id`));
    }
    const valores = { id };
    for (const c of nomes) valores[c] = typeof campos[c] === 'boolean' ? Number(campos[c]) : campos[c];
    return cache.get(chave).run(valores).changes;
  };
}

function criarRepositorios(db) {
  const p = (sql) => db.prepare(sql);
  const q = {
    usuarioPorId: p('SELECT * FROM usuarios WHERE id = ?'),
    usuarioPorEmail: p('SELECT * FROM usuarios WHERE email = ?'),
    usuarios: p('SELECT * FROM usuarios ORDER BY rowid'),
    usuarioInserir: p(`
      INSERT INTO usuarios (id, nome, email, telefone, senha_hash, papel, criado_em)
      VALUES (@id, @nome, @email, @telefone, @senha_hash, @papel, @criado_em)`),

    medicos: p('SELECT id, nome, especialidade FROM medicos ORDER BY rowid'),
    medicoPorId: p('SELECT id, nome, especialidade FROM medicos WHERE id = ?'),
    medicoInserir: p('INSERT INTO medicos (id, nome, especialidade) VALUES (@id, @nome, @especialidade)'),
    medicoRemover: p('DELETE FROM medicos WHERE id = ?'),
    medicosContar: p('SELECT COUNT(*) AS n FROM medicos'),

    horarios: p(`${SELECT_HORARIO} ORDER BY h.data, h.hora, m.nome`),
    horariosDoMedico: p(`${SELECT_HORARIO} WHERE h.medico_id = ? ORDER BY h.data, h.hora`),
    horariosLivres: p(`${SELECT_HORARIO} WHERE ${LIVRE} AND ${DEPOIS_DE} ORDER BY h.data, h.hora, m.nome`),
    horariosLivresDoMedico: p(`${SELECT_HORARIO}
      WHERE h.medico_id = @medicoId AND ${LIVRE} AND ${DEPOIS_DE} ORDER BY h.data, h.hora`),
    horariosLivresContar: p(`
      SELECT COUNT(*) AS n FROM horarios h
      LEFT JOIN agendamentos a ON a.horario_id = h.id AND a.status = 'agendado'
      WHERE ${LIVRE} AND ${DEPOIS_DE}`),
    horarioPorId: p(`${SELECT_HORARIO} WHERE h.id = ?`),
    horariosBrutos: p('SELECT id, medico_id, data, hora, bloqueado FROM horarios ORDER BY rowid'),
    horarioInserir: p(`
      INSERT INTO horarios (id, medico_id, data, hora, bloqueado)
      VALUES (@id, @medico_id, @data, @hora, @bloqueado)`),
    horarioRemover: p('DELETE FROM horarios WHERE id = ?'),
    horariosRemoverDoMedico: p('DELETE FROM horarios WHERE medico_id = ?'),
    horarioIgual: p(`
      SELECT 1 FROM horarios
      WHERE medico_id = @medicoId AND data = @data AND hora = @hora AND id <> @excetoId`),

    agendamentos: p('SELECT * FROM agendamentos ORDER BY data, hora, criado_em'),
    agendamentosDoPaciente: p('SELECT * FROM agendamentos WHERE paciente_id = ? ORDER BY data, hora, criado_em'),
    agendamentosAtivosEntre: p(`
      SELECT * FROM agendamentos
      WHERE status = 'agendado' AND data BETWEEN @inicio AND @fim ORDER BY data, hora`),
    agendamentoPorId: p('SELECT * FROM agendamentos WHERE id = ?'),
    agendamentosBrutos: p('SELECT * FROM agendamentos ORDER BY rowid'),
    agendamentoInserir: p(`
      INSERT INTO agendamentos (id, horario_id, medico_id, paciente_id, medico_nome,
        medico_especialidade, paciente_nome, data, hora, status, criado_em, cancelado_em, cancelado_por)
      VALUES (@id, @horario_id, @medico_id, @paciente_id, @medico_nome, @medico_especialidade,
        @paciente_nome, @data, @hora, @status, @criado_em, @cancelado_em, @cancelado_por)`),
    agendamentoCancelar: p(`
      UPDATE agendamentos SET status = 'cancelado', cancelado_em = @cancelado_em,
        cancelado_por = @cancelado_por WHERE id = @id AND status = 'agendado'`),
    pacienteOcupado: p(`
      SELECT 1 FROM agendamentos
      WHERE paciente_id = @pacienteId AND data = @data AND hora = @hora AND status = 'agendado'`),
    futurosDoPaciente: p(`
      SELECT COUNT(*) AS n FROM agendamentos
      WHERE paciente_id = @pacienteId AND status = 'agendado'
        AND (data > @data OR (data = @data AND hora > @hora))`),
    futurosDoMedico: p(`
      SELECT COUNT(*) AS n FROM agendamentos
      WHERE medico_id = @medicoId AND status = 'agendado'
        AND (data > @data OR (data = @data AND hora > @hora))`),
    renomearMedicoNosAtivos: p(`
      UPDATE agendamentos SET medico_nome = @nome, medico_especialidade = @especialidade
      WHERE medico_id = @medicoId AND status = 'agendado'`),
    renomearPacienteNosAtivos: p(`
      UPDATE agendamentos SET paciente_nome = @nome
      WHERE paciente_id = @pacienteId AND status = 'agendado'`),
  };
  const atualizarUsuario = atualizador(db, 'usuarios', ['nome', 'telefone', 'senha_hash', 'senha_alterada_em']);
  const atualizarMedico = atualizador(db, 'medicos', ['nome', 'especialidade']);
  const atualizarHorario = atualizador(db, 'horarios', ['data', 'hora', 'bloqueado']);

  const usuarios = {
    buscar: (id) => q.usuarioPorId.get(id),
    buscarPorEmail: (email) => q.usuarioPorEmail.get(email),
    listar: () => q.usuarios.all(),
    inserir(u) {
      q.usuarioInserir.run({ telefone: '', criado_em: new Date().toISOString(), ...u });
      return usuarios.buscar(u.id);
    },
    atualizar(id, campos) {
      atualizarUsuario(id, campos);
      return usuarios.buscar(id);
    },
  };

  const medicos = {
    listar: () => q.medicos.all(),
    buscar: (id) => q.medicoPorId.get(id),
    contar: () => q.medicosContar.get().n,
    inserir(m) {
      q.medicoInserir.run({ id: m.id, nome: m.nome, especialidade: m.especialidade });
      return medicos.buscar(m.id);
    },
    // Devolve o médico atualizado, ou undefined se o id não existe.
    atualizar(id, campos) {
      atualizarMedico(id, campos);
      return medicos.buscar(id);
    },
    remover: (id) => q.medicoRemover.run(id),
  };

  const horarios = {
    listar: (medicoId) => (medicoId ? q.horariosDoMedico.all(medicoId) : q.horarios.all()).map(paraHorario),
    // Só os livres depois de `momento` ({ data, hora }).
    listarLivres: (medicoId, momento) =>
      (medicoId
        ? q.horariosLivresDoMedico.all({ medicoId, ...momento })
        : q.horariosLivres.all(momento)
      ).map(paraHorario),
    contarLivres: (momento) => q.horariosLivresContar.get(momento).n,
    buscar: (id) => paraHorario(q.horarioPorId.get(id)),
    listarBrutos: () => q.horariosBrutos.all().map((h) => ({ ...h, bloqueado: Boolean(h.bloqueado) })),
    inserir(h) {
      q.horarioInserir.run({
        id: h.id,
        medico_id: h.medico_id,
        data: h.data,
        hora: h.hora,
        bloqueado: Number(Boolean(h.bloqueado)),
      });
      return horarios.buscar(h.id);
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
    listar: (pacienteId) =>
      pacienteId ? q.agendamentosDoPaciente.all(pacienteId) : q.agendamentos.all(),
    ativosEntre: (inicio, fim) => q.agendamentosAtivosEntre.all({ inicio, fim }),
    buscar: (id) => q.agendamentoPorId.get(id),
    listarBrutos: () => q.agendamentosBrutos.all(),
    inserir(a) {
      q.agendamentoInserir.run({
        horario_id: null,
        medico_id: null,
        status: 'agendado',
        criado_em: new Date().toISOString(),
        cancelado_em: null,
        cancelado_por: null,
        ...a,
      });
      return agendamentos.buscar(a.id);
    },
    cancelar(id, { cancelado_em, cancelado_por }) {
      q.agendamentoCancelar.run({ id, cancelado_em, cancelado_por });
      return agendamentos.buscar(id);
    },
    pacienteOcupado: ({ pacienteId, data, hora }) =>
      Boolean(q.pacienteOcupado.get({ pacienteId, data, hora })),
    contarFuturosDoPaciente: (pacienteId, momento) => q.futurosDoPaciente.get({ pacienteId, ...momento }).n,
    contarFuturosDoMedico: (medicoId, momento) => q.futurosDoMedico.get({ medicoId, ...momento }).n,
    renomearMedicoNosAtivos: (medicoId, { nome, especialidade }) =>
      q.renomearMedicoNosAtivos.run({ medicoId, nome, especialidade }),
    renomearPacienteNosAtivos: (pacienteId, nome) => q.renomearPacienteNosAtivos.run({ pacienteId, nome }),
  };

  return { usuarios, medicos, horarios, agendamentos };
}

module.exports = { criarRepositorios };
