// Modo demonstração: "Entrar como paciente / clínica" sem senha nenhuma. Só existe
// com DEMO_ENABLED=true. Cada visita de paciente ganha uma conta efêmera própria;
// a clínica é um gestor de demonstração compartilhado.
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const request = require('supertest');
const { lerConfig } = require('../src/config');
const { prepararDemonstracao, resetarDemonstracao } = require('../src/services/demonstracao');
const { criarGestor } = require('../scripts/criar-gestor');
const { criarAmbiente, AGORA } = require('./apoio');

const BASE = { JWT_SECRET: 'x'.repeat(32) };
const ambientes = [];
after(() => ambientes.forEach((a) => a.fechar()));

const configDemo = (envExtra = {}) => lerConfig({ ...BASE, BCRYPT_CUSTO: '4', DEMO_ENABLED: 'true', ...envExtra });

// Banco de demonstração com o cenário de exemplo, no "agora" fixo dos testes.
function ambienteDemo(envExtra = {}) {
  const config = configDemo(envExtra);
  const amb = criarAmbiente({ demo: config.demo });
  ambientes.push(amb);
  amb.semear({ usuarios: [], medicos: [] });
  resetarDemonstracao(amb.armazenamento, config, AGORA);
  return amb;
}

const entrarComo = (amb, papel) => request(amb.app).post('/api/demo/entrar').send({ papel });
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

test('sem DEMO_ENABLED o modo demonstração fica desligado e /api/demo responde 404', async () => {
  assert.equal(lerConfig(BASE).demo.ativo, false);
  const amb = criarAmbiente();
  ambientes.push(amb);
  assert.equal((await request(amb.app).get('/api/demo')).status, 404);
  assert.equal((await request(amb.app).post('/api/demo/entrar').send({ papel: 'paciente' })).status, 404);
});

test('a configuração da demonstração não tem senha nenhuma', () => {
  const demo = configDemo({ DEMO_MAX_VISITANTES: '7' }).demo;
  assert.equal(demo.maxVisitantes, 7);
  assert.equal(configDemo().demo.maxVisitantes, 50);
  assert.doesNotMatch(JSON.stringify(demo), /senha/i);
});

test('GET /api/demo (sem login) lista só os papéis, sem e-mail nem senha', async () => {
  const amb = ambienteDemo();
  const res = await request(amb.app).get('/api/demo');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.contas.map((c) => c.papel).sort(), ['gestor', 'paciente']);
  for (const conta of res.body.contas) assert.deepEqual(Object.keys(conta).sort(), ['nome', 'papel']);
});

test('cada "Entrar como paciente" cria uma paciente efêmera, com consulta futura e histórico', async () => {
  const amb = ambienteDemo();
  const a = await entrarComo(amb, 'paciente');
  const b = await entrarComo(amb, 'paciente');
  assert.equal(a.status, 200);
  assert.equal(a.body.usuario.papel, 'paciente');
  assert.equal(a.body.usuario.demo, true);
  assert.notEqual(a.body.usuario.id, b.body.usuario.id);
  const consultas = (await request(amb.app).get('/api/agendamentos').set(bearer(a.body.token))).body;
  assert.deepEqual(consultas.map((c) => c.situacao).sort(), ['agendado', 'cancelado', 'realizado']);
  assert.ok(consultas.every((c) => c.paciente_id === a.body.usuario.id));
});

test('a consulta de exemplo da visitante deixa livre o primeiro dia da agenda (para ela agendar ali)', async () => {
  const amb = ambienteDemo();
  for (let i = 0; i < 8; i++) {
    const { token } = (await entrarComo(amb, 'paciente')).body;
    const livres = (await request(amb.app).get('/api/horarios').set(bearer(token))).body;
    const minhas = (await request(amb.app).get('/api/agendamentos').set(bearer(token))).body;
    const futura = minhas.find((c) => c.situacao === 'agendado');
    assert.notEqual(futura.data, livres[0].data);
  }
});

// Horários livres para quem tem o token, em momentos distintos e longe das
// consultas que a pessoa já tem.
async function livresParaAgendar(amb, token) {
  const minhas = (await request(amb.app).get('/api/agendamentos').set(bearer(token))).body;
  const ocupados = new Set(minhas.map((c) => `${c.data} ${c.hora}`));
  const livres = (await request(amb.app).get('/api/horarios').set(bearer(token))).body;
  return livres.filter((h) => {
    const momento = `${h.data} ${h.hora}`;
    if (ocupados.has(momento)) return false;
    ocupados.add(momento);
    return true;
  });
}

test('a paciente efêmera agenda mais duas consultas e só então chega ao limite (409)', async () => {
  const amb = ambienteDemo();
  const agendar = (tk, h) =>
    request(amb.app).post('/api/agendamentos').set(bearer(tk)).send({ horario_id: h.id, medico_id: h.medico_id });
  const { token } = (await entrarComo(amb, 'paciente')).body;
  const livres = await livresParaAgendar(amb, token);
  assert.equal((await agendar(token, livres[0])).status, 201);
  assert.equal((await agendar(token, livres[1])).status, 201);
  const cheia = await agendar(token, livres[2]);
  assert.equal(cheia.status, 409);
  assert.match(cheia.body.erro, /3 consultas/);
  // Outra visitante não herda o limite da primeira.
  const outra = (await entrarComo(amb, 'paciente')).body.token;
  assert.equal((await agendar(outra, (await livresParaAgendar(amb, outra))[0])).status, 201);
});

test('"Entrar como clínica" entra sempre no mesmo gestor de demonstração', async () => {
  const amb = ambienteDemo();
  const a = (await entrarComo(amb, 'gestor')).body;
  const b = (await entrarComo(amb, 'gestor')).body;
  assert.equal(a.usuario.papel, 'gestor');
  assert.equal(a.usuario.demo, true);
  assert.equal(a.usuario.id, b.usuario.id);
  assert.equal((await request(amb.app).get('/api/painel').set(bearer(a.token))).status, 200);
});

test('papel desconhecido em /api/demo/entrar responde 400', async () => {
  const amb = ambienteDemo();
  assert.equal((await entrarComo(amb, 'admin')).status, 400);
  assert.equal((await request(amb.app).post('/api/demo/entrar').send({})).status, 400);
});

test('teto de visitantes: passando de DEMO_MAX_VISITANTES, a mais antiga sai com as consultas dela', async () => {
  const amb = ambienteDemo({ DEMO_MAX_VISITANTES: '2' });
  const primeira = (await entrarComo(amb, 'paciente')).body;
  await entrarComo(amb, 'paciente');
  await entrarComo(amb, 'paciente');
  const dados = amb.dados();
  const visitantes = dados.usuarios.filter((u) => u.demo && u.papel === 'paciente');
  assert.equal(visitantes.length, 2);
  assert.ok(!visitantes.some((u) => u.id === primeira.usuario.id));
  assert.ok(!dados.agendamentos.some((ag) => ag.paciente_id === primeira.usuario.id));
  assert.equal((await request(amb.app).get('/api/auth/eu').set(bearer(primeira.token))).status, 401);
});

test('o reset da demonstração apaga as pacientes efêmeras', async () => {
  const amb = ambienteDemo();
  await entrarComo(amb, 'paciente');
  await entrarComo(amb, 'paciente');
  resetarDemonstracao(amb.armazenamento, configDemo(), AGORA);
  assert.equal(amb.dados().usuarios.filter((u) => u.demo && u.papel === 'paciente').length, 0);
});

test('contas de demonstração não trocam a senha nem o perfil (403)', async () => {
  const amb = ambienteDemo();
  for (const papel of ['paciente', 'gestor']) {
    const { token } = (await entrarComo(amb, papel)).body;
    const senha = await request(amb.app)
      .put('/api/auth/senha')
      .set(bearer(token))
      .send({ senha_atual: 'Qualquer2026', nova_senha: 'OutraSenha2026' });
    assert.equal(senha.status, 403, papel);
    const perfil = await request(amb.app).put('/api/auth/eu').set(bearer(token)).send({ nome: 'Outro Nome' });
    assert.equal(perfil.status, 403, papel);
  }
});

test('contas de demonstração não entram por e-mail e senha', async () => {
  const amb = ambienteDemo();
  const { usuario } = (await entrarComo(amb, 'gestor')).body;
  const res = await request(amb.app).post('/api/auth/login').send({ email: usuario.email, senha: 'Qualquer2026' });
  assert.equal(res.status, 401);
});

test('prepararDemonstracao não sobrescreve um usuário real com o mesmo e-mail', () => {
  const amb = criarAmbiente();
  ambientes.push(amb);
  amb.semear();
  const config = configDemo({ DEMO_GESTOR_EMAIL: 'gestor@teste.dev' });
  assert.throws(() => prepararDemonstracao(amb.armazenamento, config), /gestor@teste\.dev/);
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
    path.join(raiz, 'backend', 'src', 'services', 'demonstracao.js'),
    path.join(raiz, 'src', 'telas', 'conexao', 'Entrar.js'),
    path.join(raiz, 'src', 'componentes', 'CartaoDemonstracao.js'),
  ];
  for (const arquivo of arquivos) {
    const texto = fs.readFileSync(arquivo, 'utf8');
    assert.doesNotMatch(texto, /Gestor2026|Paciente2026|DEMO_\w+_SENHA/, arquivo);
  }
});

test('resetarDemonstracao recria médicos, agenda, consultas de exemplo e o gestor demo', () => {
  const amb = ambienteDemo();
  resetarDemonstracao(amb.armazenamento, configDemo(), new Date('2030-01-11T09:00:00-03:00'));
  const dados = amb.dados();
  assert.ok(dados.medicos.length >= 4);
  assert.ok(dados.horarios.length > 100);
  assert.ok(dados.usuarios.some((u) => u.demo && u.papel === 'gestor'));
  assert.ok(dados.agendamentos.some((a) => a.status === 'agendado'));
  // Tudo coerente: nenhum horário com dois agendamentos ativos.
  const ativos = dados.agendamentos.filter((a) => a.status === 'agendado').map((a) => a.horario_id);
  assert.equal(new Set(ativos).size, ativos.length);
});

test('TRUST_PROXY é lido do ambiente (padrão 0: sem proxy confiável)', () => {
  assert.equal(lerConfig(BASE).trustProxy, 0);
  assert.equal(lerConfig({ ...BASE, TRUST_PROXY: '1' }).trustProxy, 1);
});

// Login errado de um "visitante" (IP no X-Forwarded-For, como o proxy do Render manda).
const tentarLogin = (amb, ip) =>
  request(amb.app)
    .post('/api/auth/login')
    .set('X-Forwarded-For', ip)
    .send({ email: 'ninguem@teste.dev', senha: 'Errada2026' });

test('atrás de proxy (TRUST_PROXY=1), o limite de tentativas vale por visitante (X-Forwarded-For)', async () => {
  const amb = criarAmbiente({ trustProxy: 1, limiteAuthMax: 2 });
  ambientes.push(amb);
  amb.semear();
  assert.equal((await tentarLogin(amb, '203.0.113.10')).status, 401);
  assert.equal((await tentarLogin(amb, '203.0.113.10')).status, 401);
  assert.equal((await tentarLogin(amb, '203.0.113.10')).status, 429);
  // Outro visitante, atrás do mesmo proxy, não foi bloqueado pelo primeiro.
  assert.equal((await tentarLogin(amb, '198.51.100.7')).status, 401);
  // O cliente não escapa do limite inventando um IP à esquerda: vale o que o proxy acrescentou.
  assert.equal((await tentarLogin(amb, '10.9.9.9, 203.0.113.10')).status, 429);
});

test('sem proxy (TRUST_PROXY=0), X-Forwarded-For é ignorado e não serve para burlar o limite', async () => {
  const amb = criarAmbiente({ trustProxy: 0, limiteAuthMax: 2 });
  ambientes.push(amb);
  amb.semear();
  await tentarLogin(amb, '203.0.113.10');
  await tentarLogin(amb, '203.0.113.11');
  assert.equal((await tentarLogin(amb, '203.0.113.12')).status, 429);
});

test('modo demonstração recusa banco com dados reais (não publica conta de gestor nem apaga nada)', () => {
  const { iniciarDemonstracao } = require('../src/services/demonstracao');
  const amb = criarAmbiente();
  ambientes.push(amb);
  amb.semear(); // usuários reais (gestor e pacientes) e médicos
  assert.throws(() => iniciarDemonstracao(amb.armazenamento, configDemo()), /banco de demonstração/);
  assert.equal(amb.dados().usuarios.filter((u) => u.demo).length, 0);
  assert.equal(amb.dados().medicos.length, 2);
});

test('banco vazio vira banco de demonstração; na próxima partida não recria', () => {
  const { iniciarDemonstracao } = require('../src/services/demonstracao');
  const amb = criarAmbiente();
  ambientes.push(amb);
  amb.semear({ usuarios: [], medicos: [] });
  const config = configDemo();
  iniciarDemonstracao(amb.armazenamento, config);
  assert.equal(amb.armazenamento.ehBancoDemo(), true);
  assert.ok(amb.dados().agendamentos.length > 0);
  amb.armazenamento.escritaSincrona((r) =>
    r.medicos.inserir({ id: 'm-novo', nome: 'Dr. Novo Teste', especialidade: 'Pediatria' })
  );
  iniciarDemonstracao(amb.armazenamento, config);
  assert.ok(
    amb.dados().medicos.some((m) => m.id === 'm-novo'),
    'não recriou na partida'
  );
});

test('semear não apaga banco com conta real, mesmo sem médicos', () => {
  const { podeSemear } = require('../src/services/demonstracao');
  const amb = criarAmbiente();
  ambientes.push(amb);
  amb.semear({ medicos: [] });
  assert.equal(podeSemear(amb.armazenamento), false);
  const vazio = criarAmbiente();
  ambientes.push(vazio);
  vazio.semear({ usuarios: [], medicos: [] });
  assert.equal(podeSemear(vazio.armazenamento), true);
});
