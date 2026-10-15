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

// "Depois de agora" sem concatenar colunas: na agenda de um médico o SQLite usa o
// índice (medico_id, data, hora); na lista geral ele percorre os médicos (barato
// nesta escala).
const DEPOIS_DE = '(h.data > @data OR (h.data = @data AND h.hora > @hora))';
const LIVRE = 'h.bloqueado = 0 AND a.id IS NULL';

// Listagens com limite (@limite; -1 = sem limite). Para a clínica valem os itens
// mais recentes por data (a agenda futura e o passado próximo), devolvidos em
// ordem crescente; para a paciente, os horários livres mais próximos.
const RECENTES = (sql, ordemDesc, ordemAsc) =>
  `SELECT * FROM (${sql} ORDER BY ${ordemDesc} LIMIT @limite) ORDER BY ${ordemAsc}`;

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
      INSERT INTO usuarios (id, nome, email, telefone, senha_hash, papel, criado_em, demo)
      VALUES (@id, @nome, @email, @telefone, @senha_hash, @papel, @criado_em, @demo)`),
    usuarioRemover: p('DELETE FROM usuarios WHERE id = ?'),
    // Pacientes efêmeras do modo demonstração, da mais antiga para a mais nova.
    visitantesDemo: p(
      "SELECT id, criado_em FROM usuarios WHERE demo = 1 AND papel = 'paciente' ORDER BY criado_em, rowid"
    ),

    medicos: p('SELECT id, nome, especialidade FROM medicos ORDER BY rowid LIMIT ?'),
    medicoPorId: p('SELECT id, nome, especialidade FROM medicos WHERE id = ?'),
    medicoInserir: p('INSERT INTO medicos (id, nome, especialidade) VALUES (@id, @nome, @especialidade)'),
    medicoRemover: p('DELETE FROM medicos WHERE id = ?'),
    medicosContar: p('SELECT COUNT(*) AS n FROM medicos'),

    horarios: p(RECENTES(SELECT_HORARIO, 'h.data DESC, h.hora DESC, m.nome DESC', 'data, hora, medico_nome')),
    horariosDoMedico: p(
      RECENTES(`${SELECT_HORARIO} WHERE h.medico_id = @medicoId`, 'h.data DESC, h.hora DESC', 'data, hora')
    ),
    horariosLivres: p(
      `${SELECT_HORARIO} WHERE ${LIVRE} AND ${DEPOIS_DE} ORDER BY h.data, h.hora, m.nome LIMIT @limite`
    ),
    horariosLivresDoMedico: p(`${SELECT_HORARIO}
      WHERE h.medico_id = @medicoId AND ${LIVRE} AND ${DEPOIS_DE} ORDER BY h.data, h.hora LIMIT @limite`),
    horariosContar: p('SELECT COUNT(*) AS n FROM horarios'),
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

    agendamentos: p(
      RECENTES('SELECT * FROM agendamentos', 'data DESC, hora DESC, criado_em DESC', 'data, hora, criado_em')
    ),
    agendamentosDoPaciente: p(
      RECENTES(
        'SELECT * FROM agendamentos WHERE paciente_id = @pacienteId',
        'data DESC, hora DESC, criado_em DESC',
        'data, hora, criado_em'
      )
    ),
    agendamentosAtivosEntre: p(`
      SELECT * FROM agendamentos
      WHERE status = 'agendado' AND data BETWEEN @inicio AND @fim ORDER BY data, hora`),
    agendamentoPorId: p('SELECT * FROM agendamentos WHERE id = ?'),
    agendamentosRemoverDoPaciente: p('DELETE FROM agendamentos WHERE paciente_id = ?'),
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
    // Só consultas futuras: as realizadas e canceladas guardam o nome da época.
    renomearMedicoNosAtivos: p(`
      UPDATE agendamentos SET medico_nome = @nome, medico_especialidade = @especialidade
      WHERE medico_id = @medicoId AND status = 'agendado'
        AND (data > @data OR (data = @data AND hora > @hora))`),
    renomearPacienteNosAtivos: p(`
      UPDATE agendamentos SET paciente_nome = @nome
      WHERE paciente_id = @pacienteId AND status = 'agendado'
        AND (data > @data OR (data = @data AND hora > @hora))`),
  };
  const atualizarUsuario = atualizador(db, 'usuarios', ['nome', 'telefone', 'senha_hash', 'versao_token']);
  const atualizarMedico = atualizador(db, 'medicos', ['nome', 'especialidade']);
  const atualizarHorario = atualizador(db, 'horarios', ['data', 'hora', 'bloqueado']);

  const usuarios = {
    buscar: (id) => q.usuarioPorId.get(id),
    buscarPorEmail: (email) => q.usuarioPorEmail.get(email),
    listar: () => q.usuarios.all(),
    inserir(u) {
      q.usuarioInserir.run({ telefone: '', criado_em: new Date().toISOString(), ...u, demo: Number(Boolean(u.demo)) });
      return usuarios.buscar(u.id);
    },
    atualizar(id, campos) {
      atualizarUsuario(id, campos);
      return usuarios.buscar(id);
    },
    listarVisitantesDemo: () => q.visitantesDemo.all(),
    remover: (id) => q.usuarioRemover.run(id).changes,
  };

  const medicos = {
    listar: (limite = -1) => q.medicos.all(limite),
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
    listar: (medicoId, limite = -1) =>
      (medicoId ? q.horariosDoMedico.all({ medicoId, limite }) : q.horarios.all({ limite })).map(paraHorario),
    // Só os livres depois de `momento` ({ data, hora }).
    listarLivres: (medicoId, momento, limite = -1) =>
      (medicoId
        ? q.horariosLivresDoMedico.all({ medicoId, ...momento, limite })
        : q.horariosLivres.all({ ...momento, limite })
      ).map(paraHorario),
    contar: () => q.horariosContar.get().n,
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
    listar: (pacienteId, limite = -1) =>
      pacienteId ? q.agendamentosDoPaciente.all({ pacienteId, limite }) : q.agendamentos.all({ limite }),
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
    removerDoPaciente: (pacienteId) => q.agendamentosRemoverDoPaciente.run(pacienteId).changes,
    pacienteOcupado: ({ pacienteId, data, hora }) => Boolean(q.pacienteOcupado.get({ pacienteId, data, hora })),
    contarFuturosDoPaciente: (pacienteId, momento) => q.futurosDoPaciente.get({ pacienteId, ...momento }).n,
    contarFuturosDoMedico: (medicoId, momento) => q.futurosDoMedico.get({ medicoId, ...momento }).n,
    renomearMedicoNosAtivos: (medicoId, { nome, especialidade }, momento) =>
      q.renomearMedicoNosAtivos.run({ medicoId, nome, especialidade, ...momento }),
    renomearPacienteNosAtivos: (pacienteId, nome, momento) =>
      q.renomearPacienteNosAtivos.run({ pacienteId, nome, ...momento }),
  };

  return { usuarios, medicos, horarios, agendamentos };
}

module.exports = { criarRepositorios };
