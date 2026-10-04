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
  corpoEscrita: (n) => ({ disponivel: n % 2 === 0 }),
  async agendamentosAtivos(base, cab) {
    const r = await fetch(`${base}/api/agendamentos`, { headers: cab.gestor });
    return (await r.json()).filter((a) => (a.status || 'agendado') === 'agendado');
  },
};

// Versão final: SQLite com login. Gestor e 20 pacientes são criados direto no
// banco (senha com bcrypt custo 10) e os tokens vêm do POST /api/auth/login.
const SENHA_CARGA = 'Carga2026';
const PACIENTES = 20;

const final = {
  nome: 'final',
  temLogin: true,
  credenciais: {
    gestor: { email: 'gestor@carga.dev', senha: SENHA_CARGA },
    pacientes: Array.from({ length: PACIENTES }, (_, i) => ({ email: `paciente${i}@carga.dev`, senha: SENHA_CARGA })),
  },
  env(pasta) {
    return {
      DB_FILE: path.join(pasta, 'markaqui.db'),
      JWT_SECRET: require('crypto').randomBytes(48).toString('base64url'),
      BCRYPT_CUSTO: '10',
      // Um único IP gera toda a carga: o limitador global fica desligado e o de
      // login, alto (o S6 mede o limitador padrão à parte).
      LIMITE_GLOBAL_POR_MINUTO: '0',
      LIMITE_AUTH_POR_MINUTO: '1000000',
    };
  },
  tamanhoDosDados(pasta) {
    return ['markaqui.db', 'markaqui.db-wal']
      .map((f) => path.join(pasta, f))
      .filter((f) => fs.existsSync(f))
      .reduce((total, f) => total + fs.statSync(f).size, 0);
  },
  async semear(pasta, totalHorarios) {
    const bcrypt = require('bcryptjs');
    const { criarArmazenamentoSqlite } = require('../src/infra/sqlite/armazenamento');
    const { medicos, horarios } = planoDeDados(totalHorarios);
    const hash = await bcrypt.hash(SENHA_CARGA, 10);
    const usuarios = [
      { id: 'carga-gestor', nome: 'Gestor Carga', email: 'gestor@carga.dev', papel: 'gestor', senha_hash: hash },
      ...Array.from({ length: PACIENTES }, (_, i) => ({
        id: `carga-paciente-${i}`, nome: `Paciente Carga ${i}`, email: `paciente${i}@carga.dev`, papel: 'paciente', senha_hash: hash,
      })),
    ];
    const armazenamento = criarArmazenamentoSqlite(path.join(pasta, 'markaqui.db'));
    armazenamento.substituirTudo({ usuarios, medicos, horarios });
    armazenamento.fechar();
    return { medicos, horarios };
  },
  async autenticar(base) {
    const entrar = async ({ email, senha }) => {
      const r = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      const { token } = await r.json();
      return { authorization: `Bearer ${token}` };
    };
    return {
      gestor: await entrar(this.credenciais.gestor),
      pacientes: await Promise.all(this.credenciais.pacientes.map(entrar)),
    };
  },
  corpoAgendamento: (horarioId) => ({ horario_id: horarioId }),
  corpoEscrita: (n) => ({ bloqueado: n % 2 === 0 }),
  agendamentosAtivos: json.agendamentosAtivos,
};

module.exports = { planoDeDados, armazenamentos: { json, final } };
