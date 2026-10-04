// Armazenamento em SQLite. Cada escrita é uma transação IMMEDIATE: a regra de
// negócio (ex.: "o horário está livre?") e a gravação acontecem juntas, e um erro
// no meio desfaz tudo.
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { migrar } = require('./esquema');
const { criarRepositorios } = require('./repositorios');

function criarArmazenamentoSqlite(arquivo) {
  if (arquivo !== ':memory:') fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  const db = new Database(arquivo);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  migrar(db);
  const repos = criarRepositorios(db);

  const transacao = (operacao) =>
    db
      .transaction(() => {
        const resultado = operacao(repos);
        if (resultado && typeof resultado.then === 'function') {
          throw new Error('A operação de escrita precisa ser síncrona');
        }
        return resultado;
      })
      .immediate();

  return {
    async leitura(operacao) {
      return operacao(repos);
    },
    async escrita(operacao) {
      return transacao(operacao);
    },
    // Mesma transação, sem promessa: para tarefas de partida (modo demonstração).
    escritaSincrona: transacao,

    // Troca todo o conteúdo do banco pelo documento dado. Usado pelos testes, pela
    // carga e pelo script de dados de demonstração.
    substituirTudo({ usuarios = [], medicos = [], horarios = [], agendamentos = [] }) {
      transacao((r) => {
        db.exec('DELETE FROM agendamentos; DELETE FROM horarios; DELETE FROM medicos; DELETE FROM usuarios;');
        usuarios.forEach((u) => r.usuarios.inserir(u));
        medicos.forEach((m) => r.medicos.inserir(m));
        horarios.forEach((h) => r.horarios.inserir(h));
        agendamentos.forEach((a) => r.agendamentos.inserir(a));
      });
    },
    exportarTudo() {
      return {
        usuarios: repos.usuarios.listar(),
        medicos: repos.medicos.listar(),
        horarios: repos.horarios.listarBrutos(),
        agendamentos: repos.agendamentos.listarBrutos(),
      };
    },
    fechar() {
      db.close();
    },
  };
}

module.exports = { criarArmazenamentoSqlite };
