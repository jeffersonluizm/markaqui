// Cria uma conta REAL de gestor da clínica (o app não tem autocadastro de gestor).
// Uso: npm run criar-gestor -- --nome "Ana Souza" --email ana@clinica.com.br
// A senha vem de CRIAR_GESTOR_SENHA no ambiente; sem ela, uma senha forte é gerada
// e mostrada uma única vez no console.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { lerConfig } = require('../src/config');
const { criarArmazenamentoSqlite } = require('../src/infra/sqlite/armazenamento');
const { senhaNova } = require('../src/validators/auth');
const { gerarId } = require('../src/infra/ids');
const { usuarioPublico } = require('../src/services/apresentacao');

async function criarGestor(armazenamento, { nome, email, senha }, custo = 10) {
  senhaNova({ senha }, 'senha');
  const emailNormal = String(email || '').trim().toLowerCase();
  if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormal)) throw new Error('Informe --nome e um --email válido.');
  const senha_hash = await bcrypt.hash(senha, custo);
  const usuario = await armazenamento.escrita((r) => {
    if (r.usuarios.buscarPorEmail(emailNormal)) throw new Error(`Já existe uma conta com ${emailNormal}.`);
    return r.usuarios.inserir({ id: gerarId(), nome: nome.trim(), email: emailNormal, papel: 'gestor', senha_hash });
  });
  return usuarioPublico(usuario);
}

const argumento = (nome) => {
  const i = process.argv.indexOf(`--${nome}`);
  return i === -1 ? undefined : process.argv[i + 1];
};

async function principal() {
  const config = lerConfig();
  const geradaAgora = !process.env.CRIAR_GESTOR_SENHA;
  const senha = process.env.CRIAR_GESTOR_SENHA || `${crypto.randomBytes(12).toString('base64url')}9k`;
  const armazenamento = criarArmazenamentoSqlite(config.arquivoBanco);
  try {
    const gestor = await criarGestor(armazenamento, { nome: argumento('nome'), email: argumento('email'), senha }, config.bcryptCusto);
    console.log(`Gestor criado: ${gestor.nome} <${gestor.email}>.`);
    if (geradaAgora) console.log(`Senha gerada (guarde agora, ela não é mostrada de novo): ${senha}`);
  } finally {
    armazenamento.fechar();
  }
}

if (require.main === module) {
  principal().catch((erro) => {
    console.error(erro.message);
    process.exitCode = 1;
  });
}

module.exports = { criarGestor };
