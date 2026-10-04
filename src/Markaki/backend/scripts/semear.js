// Cria o banco de demonstração: médicos fictícios e horários nos próximos dias úteis.
// Uso: npm run semear            (só semeia se o banco estiver vazio)
//      npm run semear -- --recriar (apaga tudo e semeia de novo)
const { config } = require('../src/config');
const { criarArmazenamentoSqlite } = require('../src/infra/sqlite/armazenamento');

const MEDICOS = [
  { id: 'demo-medico-1', nome: 'Dra. Helena Duarte', especialidade: 'Cardiologia' },
  { id: 'demo-medico-2', nome: 'Dr. Rafael Moura', especialidade: 'Ortopedia' },
  { id: 'demo-medico-3', nome: 'Dra. Camila Nogueira', especialidade: 'Pediatria' },
  { id: 'demo-medico-4', nome: 'Dr. André Lacerda', especialidade: 'Clínica Geral' },
];
const HORAS = ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'];
const DIAS_UTEIS = 10;

function proximosDiasUteis(quantidade, hoje = new Date()) {
  const dias = [];
  const dia = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));
  while (dias.length < quantidade) {
    dia.setUTCDate(dia.getUTCDate() + 1);
    const semana = dia.getUTCDay();
    if (semana !== 0 && semana !== 6) dias.push(dia.toISOString().slice(0, 10));
  }
  return dias;
}

function dadosDeDemonstracao() {
  const horarios = [];
  for (const medico of MEDICOS) {
    for (const data of proximosDiasUteis(DIAS_UTEIS)) {
      for (const hora of HORAS) {
        horarios.push({ id: `${medico.id}-${data}-${hora}`, medico_id: medico.id, data, hora });
      }
    }
  }
  return { medicos: MEDICOS.map((m) => ({ ...m, imagem: '' })), horarios };
}

function principal() {
  const recriar = process.argv.includes('--recriar');
  const armazenamento = criarArmazenamentoSqlite(config.arquivoBanco);
  try {
    const atual = armazenamento.exportarTudo();
    if (atual.medicos.length > 0 && !recriar) {
      console.log(`O banco ${config.arquivoBanco} já tem dados. Use --recriar para apagar e semear de novo.`);
      return;
    }
    const dados = dadosDeDemonstracao();
    armazenamento.substituirTudo(dados);
    console.log(`Banco semeado em ${config.arquivoBanco}: ${dados.medicos.length} médicos, ${dados.horarios.length} horários.`);
  } finally {
    armazenamento.fechar();
  }
}

if (require.main === module) principal();

module.exports = { dadosDeDemonstracao, proximosDiasUteis };
