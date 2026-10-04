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

// Versão com arquivo JSON e sem login (linha de base, antes da troca).
const json = {
  nome: 'json',
  env(pasta) {
    return { DATA_FILE: path.join(pasta, 'database.json') };
  },
  arquivoDeDados(pasta) {
    return path.join(pasta, 'database.json');
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
    fs.writeFileSync(this.arquivoDeDados(pasta), JSON.stringify(dados, null, 2));
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

module.exports = { planoDeDados, armazenamentos: { json } };
