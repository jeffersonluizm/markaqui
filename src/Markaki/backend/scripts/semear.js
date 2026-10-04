// Cria o banco de demonstração: a conta do gestor (a única forma de existir um
// gestor), uma paciente de exemplo, médicos fictícios e horários nos próximos
// dias úteis.
// Uso: npm run semear              (só semeia se o banco estiver vazio)
//      npm run semear -- --recriar (apaga tudo e semeia de novo)
// As contas de demonstração vêm do .env (DEMO_*; modelo em .env.example).
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { caminhoBanco } = require('../src/config');
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

// Sem senha definida no .env, gera uma aleatória (nunca uma senha conhecida).
const senhaAleatoria = () => `${crypto.randomBytes(9).toString('base64url')}7a`;

async function dadosDeDemonstracao({ env = process.env, custo = 10, hoje = new Date() } = {}) {
  const contas = [
    { id: 'demo-gestor', nome: 'Gestão Clínica Markaqui', papel: 'gestor', chave: 'gestor',
      email: env.DEMO_GESTOR_EMAIL || 'gestor@markaqui.demo', senha: env.DEMO_GESTOR_SENHA },
    { id: 'demo-paciente', nome: 'Marina Albuquerque', papel: 'paciente', telefone: '31988887777', chave: 'paciente',
      email: env.DEMO_PACIENTE_EMAIL || 'paciente@markaqui.demo', senha: env.DEMO_PACIENTE_SENHA },
  ];
  const usuarios = [];
  const senhasGeradas = {};
  for (const { senha, chave, ...conta } of contas) {
    const final = senha || (senhasGeradas[chave] = senhaAleatoria());
    usuarios.push({ telefone: '', ...conta, senha_hash: await bcrypt.hash(final, custo) });
  }
  const horarios = [];
  for (const medico of MEDICOS) {
    for (const data of proximosDiasUteis(DIAS_UTEIS, hoje)) {
      for (const hora of HORAS) {
        horarios.push({ id: `${medico.id}-${data}-${hora}`, medico_id: medico.id, data, hora });
      }
    }
  }
  return { usuarios, medicos: MEDICOS, horarios, senhasGeradas };
}

async function principal() {
  const recriar = process.argv.includes('--recriar');
  const arquivo = caminhoBanco();
  const armazenamento = criarArmazenamentoSqlite(arquivo);
  try {
    if (armazenamento.exportarTudo().usuarios.length > 0 && !recriar) {
      console.log(`O banco ${arquivo} já tem dados. Use "npm run semear -- --recriar" para apagar e semear de novo.`);
      return;
    }
    const { senhasGeradas, ...dados } = await dadosDeDemonstracao();
    armazenamento.substituirTudo(dados);
    console.log(`Banco semeado em ${arquivo}: ${dados.medicos.length} médicos, ${dados.horarios.length} horários.`);
    console.log('Contas de demonstração: e-mails em DEMO_GESTOR_EMAIL e DEMO_PACIENTE_EMAIL (.env).');
    for (const [conta, senha] of Object.entries(senhasGeradas)) {
      console.log(`Senha gerada para a conta ${conta} (defina DEMO_${conta.toUpperCase()}_SENHA no .env para fixar): ${senha}`);
    }
  } finally {
    armazenamento.fechar();
  }
}

if (require.main === module) {
  principal().catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  });
}

module.exports = { dadosDeDemonstracao, proximosDiasUteis };
