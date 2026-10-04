// Como preparar cada armazenamento para a carga: variáveis de ambiente da API,
// dados iniciais (gravados direto, sem passar pela API) e cabeçalhos de autenticação.
const fs = require('fs');
const path = require('path');

const MEDICOS = 20;

// Datas futuras e horas "HH:MM" distintas por médico: n horários no total.
function planoDeDados(totalHorarios) {
  const medicos = Array.from({ length: MEDICOS }, (_, i) => ({
    id: `m${i + 1}`,
    nome: `Dra. Carga ${i + 1}`,
    especialidade: 'Clínica Geral',
  }));
  const horarios = [];
  for (let i = 0; i < totalHorarios; i++) {
    const medico = medicos[i % MEDICOS];
    const k = Math.floor(i / MEDICOS);
    const dia = new Date(Date.UTC(2030, 0, 1 + Math.floor(k / 20)));
    const minutos = 7 * 60 + (k % 20) * 30;
    horarios.push({
      id: `h${i + 1}`,
      medico_id: medico.id,
      data: dia.toISOString().slice(0, 10),
      hora: `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`,
    });
  }
  return { medicos, horarios };
}

// Versão com arquivo JSON e sem login (linha de base, antes da troca). Só funciona
// com a API do commit 27c2754, a última com o armazenamento em JSON.
const json = {
  nome: 'json',
  env(pasta) {
    return { DATA_FILE: path.join(pasta, 'database.json') };
  },
  tamanhoDosDados(pasta) {
    return fs.statSync(path.join(pasta, 'database.json')).size;
  },
  async semear(pasta, totalHorarios) {
    const { medicos, horarios } = planoDeDados(totalHorarios);
    const dados = {
      medicos: medicos.map((m) => ({ ...m, imagem: '' })),
      horarios: horarios.map((h) => ({
        ...h,
        disponivel: true,
        paciente_nome: '',
        medico_nome: medicos.find((m) => m.id === h.medico_id).nome,
      })),
      agendamentos: [],
    };
    fs.writeFileSync(path.join(pasta, 'database.json'), JSON.stringify(dados, null, 2));
    return { medicos, horarios };
  },
  // Sem login: todos os pedidos vão sem cabeçalho.
  async autenticar() {
    return { gestor: {}, pacientes: Array.from({ length: 20 }, () => ({})) };
  },
  corpoAgendamento(horarioId, i) {
    return { horario_id: horarioId, paciente_nome: `Paciente ${i}` };
  },
  async agendamentosAtivos(base, cab) {
    const r = await fetch(`${base}/api/agendamentos`, { headers: cab.gestor });
    return (await r.json()).filter((a) => (a.status || 'agendado') === 'agendado');
  },
};

// Versão com SQLite (depois da troca). O banco é criado e semeado pelo próprio
// armazenamento da API, numa pasta temporária.
const sqlite = {
  nome: 'sqlite',
  env(pasta) {
    return { DB_FILE: path.join(pasta, 'markaqui.db') };
  },
  // Tamanho do banco somado ao do WAL (onde ficam as escritas recentes).
  tamanhoDosDados(pasta) {
    return ['markaqui.db', 'markaqui.db-wal']
      .map((f) => path.join(pasta, f))
      .filter((f) => fs.existsSync(f))
      .reduce((total, f) => total + fs.statSync(f).size, 0);
  },
  async semear(pasta, totalHorarios) {
    const { criarArmazenamentoSqlite } = require('../src/infra/sqlite/armazenamento');
    const { medicos, horarios } = planoDeDados(totalHorarios);
    const armazenamento = criarArmazenamentoSqlite(path.join(pasta, 'markaqui.db'));
    armazenamento.substituirTudo({
      medicos: medicos.map((m) => ({ ...m, imagem: '' })),
      horarios: horarios.map((h) => ({ ...h, disponivel: true, paciente_nome: '' })),
    });
    armazenamento.fechar();
    return { medicos, horarios };
  },
  autenticar: json.autenticar,
  corpoAgendamento: json.corpoAgendamento,
  agendamentosAtivos: json.agendamentosAtivos,
};

module.exports = { planoDeDados, armazenamentos: { json, sqlite } };
