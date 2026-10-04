// Prepara o banco local com o cenário de demonstração: médicos fictícios, agenda
// nos próximos dias úteis, algumas consultas e as contas de demonstração (se
// DEMO_ENABLED=true no .env). Contas reais de gestor: npm run criar-gestor.
// Uso: npm run semear              (só se o banco ainda não tiver médicos)
//      npm run semear -- --recriar (apaga tudo e recria)
const { lerConfig } = require('../src/config');
const { criarArmazenamentoSqlite } = require('../src/infra/sqlite/armazenamento');
const {
  dadosDeDemonstracao,
  proximosDiasUteis,
  resetarDemonstracao,
  podeSemear,
} = require('../src/services/demonstracao');

function principal() {
  const config = lerConfig();
  const recriar = process.argv.includes('--recriar');
  const armazenamento = criarArmazenamentoSqlite(config.arquivoBanco);
  try {
    const jaTemCenario = armazenamento.ehBancoDemo() && armazenamento.exportarTudo().medicos.length > 0;
    if (!recriar && (jaTemCenario || !podeSemear(armazenamento))) {
      console.log(
        jaTemCenario
          ? `O banco ${config.arquivoBanco} já tem o cenário de demonstração.`
          : `O banco ${config.arquivoBanco} tem dados reais e não foi alterado. Para apagar tudo: npm run semear -- --recriar`
      );
      return;
    }
    resetarDemonstracao(armazenamento, config);
    const dados = armazenamento.exportarTudo();
    console.log(
      `Banco pronto em ${config.arquivoBanco}: ${dados.medicos.length} médicos, ${dados.horarios.length} horários, ${dados.agendamentos.length} consultas de exemplo.`
    );
    console.log(
      config.demo.ativo
        ? 'Modo demonstração ligado: o app mostra "Entrar como paciente / clínica".'
        : 'Modo demonstração desligado (DEMO_ENABLED=false): crie um gestor com "npm run criar-gestor".'
    );
  } finally {
    armazenamento.fechar();
  }
}

if (require.main === module) {
  try {
    principal();
  } catch (erro) {
    console.error(erro.message);
    process.exitCode = 1;
  }
}

module.exports = { dadosDeDemonstracao, proximosDiasUteis };
