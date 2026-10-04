// Modo demonstração: contas de paciente e gestor sem senha no código. Só existe
// com DEMO_ENABLED=true; as senhas vêm do .env ou são geradas na partida.
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const request = require('supertest');
const { lerConfig } = require('../src/config');
const { prepararDemonstracao, resetarDemonstracao } = require('../src/services/demonstracao');
const { criarGestor } = require('../scripts/criar-gestor');
const { criarAmbiente } = require('./apoio');

const BASE = { JWT_SECRET: 'x'.repeat(32) };
const ambientes = [];
after(() => ambientes.forEach((a) => a.fechar()));

function ambienteDemo(envExtra = {}) {
  const config = lerConfig({ ...BASE, BCRYPT_CUSTO: '4', ...envExtra });
  const amb = criarAmbiente({ demo: config.demo });
  amb.semear({ usuarios: [] });
  prepararDemonstracao(amb.armazenamento, { ...config, bcryptCusto: 4 });
  ambientes.push(amb);
  return amb;
}

test('sem DEMO_ENABLED o modo demonstração fica desligado e /api/demo responde 404', async () => {
  assert.equal(lerConfig(BASE).demo.ativo, false);
  const amb = criarAmbiente();
  ambientes.push(amb);
  const res = await request(amb.app).get('/api/demo');
  assert.equal(res.status, 404);
});

test('com DEMO_ENABLED e sem senha no .env, as senhas são geradas fortes e diferentes', () => {
  const a = lerConfig({ ...BASE, DEMO_ENABLED: 'true' }).demo.contas;
  const b = lerConfig({ ...BASE, DEMO_ENABLED: 'true' }).demo.contas;
  for (const conta of [a.paciente, a.gestor]) {
    assert.ok(conta.senha.length >= 16);
    assert.match(conta.senha, /[A-Za-z]/);
    assert.match(conta.senha, /\d/);
  }
  assert.notEqual(a.gestor.senha, b.gestor.senha);
  assert.notEqual(a.paciente.senha, a.gestor.senha);
});

test('senhas da demonstração vêm do .env quando definidas', () => {
  const { contas } = lerConfig({
    ...BASE,
    DEMO_ENABLED: 'true',
    DEMO_GESTOR_SENHA: 'GestorForte2026x',
    DEMO_PACIENTE_SENHA: 'PacienteForte2026x',
  }).demo;
  assert.equal(contas.gestor.senha, 'GestorForte2026x');
  assert.equal(contas.paciente.senha, 'PacienteForte2026x');
});

test('GET /api/demo (sem login) devolve as contas e elas entram com o papel certo', async () => {
  const amb = ambienteDemo({ DEMO_ENABLED: 'true' });
  const res = await request(amb.app).get('/api/demo');
  assert.equal(res.status, 200);
  const papeis = res.body.contas.map((c) => c.papel).sort();
  assert.deepEqual(papeis, ['gestor', 'paciente']);
  for (const conta of res.body.contas) {
    const login = await request(amb.app).post('/api/auth/login').send({ email: conta.email, senha: conta.senha });
    assert.equal(login.status, 200, conta.papel);
    assert.equal(login.body.usuario.papel, conta.papel);
    assert.equal(login.body.usuario.demo, true);
  }
});

test('prepararDemonstracao é idempotente e troca a senha quando o .env muda', async () => {
  const amb = ambienteDemo({ DEMO_ENABLED: 'true', DEMO_GESTOR_SENHA: 'PrimeiraSenha2026' });
  const config = lerConfig({ ...BASE, DEMO_ENABLED: 'true', DEMO_GESTOR_SENHA: 'SegundaSenha2026' });
  prepararDemonstracao(amb.armazenamento, { ...config, bcryptCusto: 4 });
  const usuarios = amb.dados().usuarios.filter((u) => u.demo);
  assert.equal(usuarios.length, 2);
  const email = config.demo.contas.gestor.email;
  assert.equal(
    (await request(amb.app).post('/api/auth/login').send({ email, senha: 'PrimeiraSenha2026' })).status,
    401
  );
  assert.equal((await request(amb.app).post('/api/auth/login').send({ email, senha: 'SegundaSenha2026' })).status, 200);
});

test('contas de demonstração não trocam a senha (403)', async () => {
  const amb = ambienteDemo({ DEMO_ENABLED: 'true' });
  const { contas } = (await request(amb.app).get('/api/demo')).body;
  const paciente = contas.find((c) => c.papel === 'paciente');
  const { token } = (
    await request(amb.app).post('/api/auth/login').send({ email: paciente.email, senha: paciente.senha })
  ).body;
  const res = await request(amb.app)
    .put('/api/auth/senha')
    .set('Authorization', `Bearer ${token}`)
    .send({ senha_atual: paciente.senha, nova_senha: 'OutraSenha2026' });
  assert.equal(res.status, 403);
});

test('prepararDemonstracao não sobrescreve um usuário real com o mesmo e-mail', () => {
  const amb = criarAmbiente();
  ambientes.push(amb);
  const config = lerConfig({ ...BASE, DEMO_ENABLED: 'true', DEMO_PACIENTE_EMAIL: 'ana@teste.dev' });
  amb.semear();
  assert.throws(() => prepararDemonstracao(amb.armazenamento, { ...config, bcryptCusto: 4 }), /ana@teste\.dev/);
});

test('criarGestor (script separado) cria gestor real com senha em hash e recusa senha fraca', async () => {
  const amb = criarAmbiente();
  ambientes.push(amb);
  amb.semear({ usuarios: [] });
  await assert.rejects(
    criarGestor(amb.armazenamento, { nome: 'Gestora Real', email: 'real@clinica.dev', senha: 'fraca' }, 4),
    /senha/i
  );
  const gestor = await criarGestor(
    amb.armazenamento,
    { nome: 'Gestora Real', email: 'Real@Clinica.dev', senha: 'SenhaForte2026' },
    4
  );
  assert.equal(gestor.papel, 'gestor');
  assert.equal(gestor.senha_hash, undefined);
  const login = await request(amb.app)
    .post('/api/auth/login')
    .send({ email: 'real@clinica.dev', senha: 'SenhaForte2026' });
  assert.equal(login.status, 200);
  assert.equal(login.body.usuario.demo, false);
});

test('nenhuma senha de demonstração escrita no código-fonte', () => {
  const raiz = path.join(__dirname, '..', '..');
  const arquivos = [
    ...fs.readdirSync(path.join(raiz, 'backend', 'scripts')).map((f) => path.join(raiz, 'backend', 'scripts', f)),
    path.join(raiz, 'backend', 'src', 'config.js'),
    path.join(raiz, 'src', 'telas', 'conexao', 'Entrar.js'),
  ];
  for (const arquivo of arquivos) {
    const texto = fs.readFileSync(arquivo, 'utf8');
    assert.doesNotMatch(texto, /Gestor2026|Paciente2026/, arquivo);
  }
});

test('resetarDemonstracao recria médicos, agenda e consultas de exemplo e as contas demo', async () => {
  const amb = ambienteDemo({ DEMO_ENABLED: 'true' });
  const config = lerConfig({ ...BASE, DEMO_ENABLED: 'true', BCRYPT_CUSTO: '4' });
  resetarDemonstracao(amb.armazenamento, config, new Date(2030, 0, 11, 9, 0));
  const dados = amb.dados();
  assert.ok(dados.medicos.length >= 4);
  assert.ok(dados.horarios.length > 100);
  const pacienteDemo = dados.usuarios.find((u) => u.demo && u.papel === 'paciente');
  const daPaciente = dados.agendamentos.filter((a) => a.paciente_id === pacienteDemo.id);
  assert.ok(daPaciente.some((a) => a.status === 'agendado'));
  assert.ok(daPaciente.some((a) => a.status === 'cancelado'));
  assert.ok(dados.agendamentos.some((a) => a.paciente_id !== pacienteDemo.id));
  // Tudo coerente: nenhum horário com dois agendamentos ativos.
  const ativos = dados.agendamentos.filter((a) => a.status === 'agendado').map((a) => a.horario_id);
  assert.equal(new Set(ativos).size, ativos.length);
});

test('atrás de proxy (Render), TRUST_PROXY faz o limite de tentativas valer por visitante', () => {
  assert.equal(lerConfig(BASE).trustProxy, 0);
  assert.equal(lerConfig({ ...BASE, TRUST_PROXY: '1' }).trustProxy, 1);
});
