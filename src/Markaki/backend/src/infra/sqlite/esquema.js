// Migrações do banco, em ordem. PRAGMA user_version guarda quantas já rodaram.
const MIGRACOES = [
  `
  CREATE TABLE medicos (
    id            TEXT PRIMARY KEY,
    nome          TEXT NOT NULL,
    especialidade TEXT NOT NULL,
    imagem        TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE horarios (
    id            TEXT PRIMARY KEY,
    medico_id     TEXT REFERENCES medicos(id),
    data          TEXT NOT NULL,
    hora          TEXT NOT NULL,
    disponivel    INTEGER NOT NULL DEFAULT 1,
    paciente_nome TEXT NOT NULL DEFAULT ''
  );
  -- O mesmo médico não tem o mesmo horário duas vezes. O índice também atende a
  -- consulta da agenda de um médico (WHERE medico_id = ?).
  CREATE UNIQUE INDEX uq_horarios_medico_data_hora ON horarios (medico_id, data, hora);

  CREATE TABLE agendamentos (
    id                   TEXT PRIMARY KEY,
    horario_id           TEXT,
    medico_id            TEXT,
    medico_nome          TEXT NOT NULL,
    medico_especialidade TEXT NOT NULL,
    paciente_nome        TEXT NOT NULL,
    data                 TEXT NOT NULL,
    hora                 TEXT NOT NULL,
    status               TEXT NOT NULL,
    criado_em            TEXT NOT NULL
  );
  -- Regra principal garantida pelo banco: um horário tem no máximo um agendamento ativo.
  CREATE UNIQUE INDEX uq_agendamento_ativo_por_horario
    ON agendamentos (horario_id) WHERE status = 'agendado';
  CREATE INDEX idx_agendamentos_medico ON agendamentos (medico_id);
  `,
];

function migrar(db) {
  const versao = db.pragma('user_version', { simple: true });
  for (let i = versao; i < MIGRACOES.length; i++) {
    db.transaction(() => {
      db.exec(MIGRACOES[i]);
      db.pragma(`user_version = ${i + 1}`);
    })();
  }
}

module.exports = { migrar };
