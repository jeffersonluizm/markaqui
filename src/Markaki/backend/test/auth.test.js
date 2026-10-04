// Autenticação: cadastro de paciente, login, sessão, perfil, troca de senha,
// limite de tentativas e o que a API devolve sem login.
const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { criarAmbiente, usuarios, SENHA, SEGREDO } = require('./apoio');

const amb = criarAmbiente();
beforeEach(() => amb.semear());
after(() => amb.fechar());

const cadastroValido = {
  nome: 'Carla Souza',
  email: 'Carla@Teste.dev ',
  telefone: '(11) 98888-7777',
  senha: 'Senha456',
  aceite_termos: true,
};

test('cadastro cria paciente, devolve token e nunca devolve o hash da senha', async () => {
  const res = await amb.como(null).post('/api/auth/cadastro').send(cadastroValido);
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.usuario.papel, 'paciente');
  assert.equal(res.body.usuario.email, 'carla@teste.dev');
  assert.equal(res.body.usuario.telefone, '11988887777');
  assert.equal(res.body.usuario.senha_hash, undefined);
  const gravado = amb.dados().usuarios.find((u) => u.email === 'carla@teste.dev');
  assert.notEqual(gravado.senha_hash, 'Senha456');
  assert.match(gravado.senha_hash, /^\$2[aby]\$/);
});

test('cadastro ignora papel enviado no corpo: ninguém vira gestor sozinho', async () => {
  const res = await amb
    .como(null)
    .post('/api/auth/cadastro')
    .send({ ...cadastroValido, papel: 'gestor' });
  assert.equal(res.status, 201);
  assert.equal(res.body.usuario.papel, 'paciente');
});

test('cadastro recusa e-mail repetido (409), sem diferenciar maiúsculas', async () => {
  const res = await amb
    .como(null)
    .post('/api/auth/cadastro')
    .send({ ...cadastroValido, email: 'ANA@teste.dev' });
  assert.equal(res.status, 409);
});

test('cadastro valida nome, e-mail, senha forte e aceite dos termos (400)', async () => {
  const casos = [
    { nome: 'A' },
    { email: 'sem-arroba' },
    { senha: 'curta1' },
    { senha: 'somenteletras' },
    { senha: 12345678 },
    { aceite_termos: false },
    { telefone: '123' },
  ];
  for (const caso of casos) {
    const res = await amb
      .como(null)
      .post('/api/auth/cadastro')
      .send({ ...cadastroValido, ...caso });
    assert.equal(res.status, 400, JSON.stringify(caso));
    assert.ok(res.body.erro);
  }
});

test('login com e-mail e senha certos devolve token com o papel', async () => {
  const res = await amb.como(null).post('/api/auth/login').send({ email: 'gestor@teste.dev', senha: SENHA });
  assert.equal(res.status, 200);
  assert.equal(res.body.usuario.papel, 'gestor');
  const conteudo = jwt.verify(res.body.token, SEGREDO);
  assert.equal(conteudo.sub, 'u-gestor');
});

test('login errado responde 401 com a mesma mensagem para e-mail e senha', async () => {
  const senhaErrada = await amb.como(null).post('/api/auth/login').send({ email: 'ana@teste.dev', senha: 'Errada123' });
  const emailErrado = await amb.como(null).post('/api/auth/login').send({ email: 'ninguem@teste.dev', senha: SENHA });
  assert.equal(senhaErrada.status, 401);
  assert.equal(emailErrado.status, 401);
  assert.equal(senhaErrada.body.erro, emailErrado.body.erro);
});

test('sem token, rotas protegidas respondem 401', async () => {
  for (const url of ['/api/medicos', '/api/horarios', '/api/agendamentos', '/api/auth/eu', '/api/painel']) {
    const res = await amb.como(null).get(url);
    assert.equal(res.status, 401, url);
  }
});

test('token adulterado ou de outro segredo responde 401', async () => {
  const falso = jwt.sign({ sub: 'u-gestor', papel: 'gestor' }, 'outro-segredo-qualquer-com-32-caracteres!');
  const res = await request(amb.app).get('/api/medicos').set('Authorization', `Bearer ${falso}`);
  assert.equal(res.status, 401);
});

test('token expirado responde 401 avisando que a sessão expirou', async () => {
  const vencido = jwt.sign({ sub: 'u-ana', papel: 'paciente', exp: Math.floor(Date.now() / 1000) - 60 }, SEGREDO);
  const res = await request(amb.app).get('/api/auth/eu').set('Authorization', `Bearer ${vencido}`);
  assert.equal(res.status, 401);
  assert.match(res.body.erro, /sessão expirou/i);
});

test('token de usuário que não existe mais responde 401', async () => {
  const res = await amb.como({ id: 'u-apagado', papel: 'paciente' }).get('/api/auth/eu');
  assert.equal(res.status, 401);
});

test('o papel vem do banco, não do token', async () => {
  const res = await amb
    .como({ ...usuarios.ana, papel: 'gestor' })
    .post('/api/medicos')
    .send({ nome: 'Dr. Intruso', especialidade: 'Clínica Geral' });
  assert.equal(res.status, 403);
});

test('GET /api/auth/eu devolve o perfil sem o hash', async () => {
  const res = await amb.como(usuarios.ana).get('/api/auth/eu');
  assert.equal(res.status, 200);
  assert.equal(res.body.email, 'ana@teste.dev');
  assert.equal(res.body.senha_hash, undefined);
});

test('PUT /api/auth/eu altera nome e telefone, mas não e-mail nem papel', async () => {
  const res = await amb.como(usuarios.ana).put('/api/auth/eu').send({ nome: 'Ana Paula', telefone: '11977776666' });
  assert.equal(res.status, 200);
  assert.equal(res.body.nome, 'Ana Paula');
  const recusado = await amb.como(usuarios.ana).put('/api/auth/eu').send({ papel: 'gestor' });
  assert.equal(recusado.status, 400);
});

test('trocar senha exige a senha atual e passa a valer a nova', async () => {
  const errada = await amb
    .como(usuarios.ana)
    .put('/api/auth/senha')
    .send({ senha_atual: 'Errada123', nova_senha: 'NovaSenha9' });
  assert.equal(errada.status, 400);
  const certa = await amb
    .como(usuarios.ana)
    .put('/api/auth/senha')
    .send({ senha_atual: SENHA, nova_senha: 'NovaSenha9' });
  assert.equal(certa.status, 200);
  const login = await amb.como(null).post('/api/auth/login').send({ email: 'ana@teste.dev', senha: 'NovaSenha9' });
  assert.equal(login.status, 200);
});

test('login e cadastro têm limite de tentativas por IP (429)', async () => {
  const limitado = criarAmbiente({ limiteAuthMax: 5 });
  limitado.semear();
  try {
    const status = [];
    for (let i = 0; i < 7; i++) {
      const res = await request(limitado.app)
        .post('/api/auth/login')
        .send({ email: 'ana@teste.dev', senha: 'Errada123' });
      status.push(res.status);
    }
    assert.deepEqual(status, [401, 401, 401, 401, 401, 429, 429]);
  } finally {
    limitado.fechar();
  }
});

test('corpo acima de 10 KB responde 413', async () => {
  const res = await amb
    .como(usuarios.gestor)
    .post('/api/medicos')
    .send({ nome: 'x'.repeat(11 * 1024), especialidade: 'Clínica Geral' });
  assert.equal(res.status, 413);
});

test('JSON inválido responde 400 em JSON', async () => {
  const res = await amb
    .como(usuarios.gestor)
    .post('/api/medicos')
    .set('Content-Type', 'application/json')
    .send('{ quebrado');
  assert.equal(res.status, 400);
  assert.ok(res.body.erro);
});

test('cabeçalhos de segurança (helmet) e sem X-Powered-By', async () => {
  const res = await amb.como(null).get('/api/saude');
  assert.equal(res.status, 200);
  assert.equal(res.headers['x-powered-by'], undefined);
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
});

test('CORS só libera as origens configuradas', async () => {
  const liberada = await request(amb.app).get('/api/saude').set('Origin', 'http://localhost:8081');
  assert.equal(liberada.headers['access-control-allow-origin'], 'http://localhost:8081');
  const outra = await request(amb.app).get('/api/saude').set('Origin', 'https://site-qualquer.example');
  assert.equal(outra.headers['access-control-allow-origin'], undefined);
});

test('rota inexistente responde 404 em JSON', async () => {
  const res = await amb.como(null).get('/api/nao-existe');
  assert.equal(res.status, 404);
  assert.ok(res.body.erro);
});

test('trocar a senha derruba as sessões antigas e devolve um token novo', async () => {
  // Emitido no mesmo segundo da troca: a versão do token, não o horário, decide.
  const antigo = amb.token(usuarios.ana);
  const res = await request(amb.app)
    .put('/api/auth/senha')
    .set('Authorization', `Bearer ${antigo}`)
    .send({ senha_atual: SENHA, nova_senha: 'NovaSenha9' });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  const comAntigo = await request(amb.app).get('/api/auth/eu').set('Authorization', `Bearer ${antigo}`);
  assert.equal(comAntigo.status, 401);
  assert.match(comAntigo.body.erro, /senha foi alterada/i);
  const comNovo = await request(amb.app).get('/api/auth/eu').set('Authorization', `Bearer ${res.body.token}`);
  assert.equal(comNovo.status, 200);
});

test('troca de senha também tem limite de tentativas (429)', async () => {
  const limitado = criarAmbiente({ limiteAuthMax: 2 });
  limitado.semear();
  try {
    const status = [];
    for (let i = 0; i < 3; i++) {
      const res = await limitado
        .como(usuarios.ana)
        .put('/api/auth/senha')
        .send({ senha_atual: 'Errada123', nova_senha: 'NovaSenha9' });
      status.push(res.status);
    }
    assert.deepEqual(status, [400, 400, 429]);
  } finally {
    limitado.fechar();
  }
});
