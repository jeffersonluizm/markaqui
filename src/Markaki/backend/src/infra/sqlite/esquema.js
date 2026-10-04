// Migrações do banco, em ordem. PRAGMA user_version guarda quantas já rodaram.
const MIGRACOES = [
  `
  CREATE TABLE usuarios (
    id         TEXT PRIMARY KEY,
    nome       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    telefone   TEXT NOT NULL DEFAULT '',
    senha_hash TEXT NOT NULL,
    papel      TEXT NOT NULL CHECK (papel IN ('paciente', 'gestor')),
    criado_em  TEXT NOT NULL
  );

  CREATE TABLE medicos (
    id            TEXT PRIMARY KEY,
    nome          TEXT NOT NULL,
    especialidade TEXT NOT NULL
  );

  CREATE TABLE horarios (
    id        TEXT PRIMARY KEY,
    medico_id TEXT NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    data      TEXT NOT NULL,
    hora      TEXT NOT NULL,
    bloqueado INTEGER NOT NULL DEFAULT 0
  );
  -- O mesmo médico não tem o mesmo horário duas vezes. O índice também atende a
  -- consulta da agenda de um médico (WHERE medico_id = ? ORDER BY data, hora).
  CREATE UNIQUE INDEX uq_horarios_medico_data_hora ON horarios (medico_id, data, hora);
  CREATE INDEX idx_horarios_data_hora ON horarios (data, hora);

  -- Médico, paciente, data e hora ficam copiados no agendamento: o histórico
  -- continua legível mesmo se o horário ou o médico forem removidos.
  CREATE TABLE agendamentos (
    id                   TEXT PRIMARY KEY,
    horario_id           TEXT REFERENCES horarios(id) ON DELETE SET NULL,
    medico_id            TEXT REFERENCES medicos(id) ON DELETE SET NULL,
    paciente_id          TEXT NOT NULL REFERENCES usuarios(id),
    medico_nome          TEXT NOT NULL,
    medico_especialidade TEXT NOT NULL,
    paciente_nome        TEXT NOT NULL,
    data                 TEXT NOT NULL,
    hora                 TEXT NOT NULL,
    status               TEXT NOT NULL CHECK (status IN ('agendado', 'cancelado')),
    criado_em            TEXT NOT NULL,
    cancelado_em         TEXT,
    cancelado_por        TEXT CHECK (cancelado_por IN ('paciente', 'gestor'))
  );
  -- Regra principal garantida pelo banco: um horário tem no máximo um agendamento ativo.
  CREATE UNIQUE INDEX uq_agendamento_ativo_por_horario
    ON agendamentos (horario_id) WHERE status = 'agendado';
  -- E a mesma paciente não tem duas consultas ativas no mesmo dia e hora.
  CREATE UNIQUE INDEX uq_agendamento_ativo_por_paciente_momento
    ON agendamentos (paciente_id, data, hora) WHERE status = 'agendado';
  CREATE INDEX idx_agendamentos_medico ON agendamentos (medico_id);
  CREATE INDEX idx_agendamentos_data ON agendamentos (data, hora);
  `,
  // 2: data da última troca de senha; tokens emitidos antes dela deixam de valer.
  `ALTER TABLE usuarios ADD COLUMN senha_alterada_em TEXT;`,
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
