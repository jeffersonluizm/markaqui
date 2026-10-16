// Modo demonstração: um único IP não pode monopolizar a demo (encher o teto de
// visitantes ou o teto de horários do gestor compartilhado). E os tetos valem
// mesmo com pedidos em paralelo (a contagem e a gravação ficam na mesma transação).
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { lerConfig } = require('../src/config');
const { resetarDemonstracao } = require('../src/services/demonstracao');
const { criarAmbiente, AGORA } = require('./apoio');

const BASE = { JWT_SECRET: 'x'.repeat(32), BCRYPT_CUSTO: '4', DEMO_ENABLED: 'true' };
const ambientes = [];
after(() => ambientes.forEach((a) => a.fechar()));

// Atrás de um proxy (TRUST_PROXY=1): o IP de cada visitante vem do X-Forwarded-For.
function ambienteDemo(envExtra = {}) {
  const config = lerConfig({ ...BASE, ...envExtra });
  const amb = criarAmbiente({ demo: config.demo, trustProxy: 1 });
  ambientes.push(amb);
  amb.semear({ usuarios: [], medicos: [] });
  resetarDemonstracao(amb.armazenamento, config, AGORA);
  return amb;
}

const entrar = (amb, ip, papel = 'paciente') =>
  request(amb.app).post('/api/demo/entrar').set('X-Forwarded-For', ip).send({ papel });
const vivo = async (amb, token) =>
  (await request(amb.app).get('/api/auth/eu').set('Authorization', `Bearer ${token}`)).status === 200;
const visitantes = (amb) => amb.dados().usuarios.filter((u) => u.demo && u.papel === 'paciente');

test('o mesmo IP tem no máximo DEMO_VISITANTES_POR_IP contas vivas: perde a própria mais antiga, nunca a de outro', async () => {
  const amb = ambienteDemo({ DEMO_VISITANTES_POR_IP: '3' });
  const outroIp = (await entrar(amb, '198.51.100.9')).body.token;
  const doAtacante = [];
  for (let i = 0; i < 4; i++) doAtacante.push((await entrar(amb, '203.0.113.5')).body.token);
  assert.equal(await vivo(amb, doAtacante[0]), false, 'a mais antiga do mesmo IP saiu');
  for (const token of doAtacante.slice(1)) assert.equal(await vivo(amb, token), true);
  assert.equal(await vivo(amb, outroIp), true, 'a conta de outro IP continua');
  assert.equal(visitantes(amb).length, 4);
});

test('um IP sozinho não enche a demo: com teto 5 e 3 por IP, outros visitantes ainda entram', async () => {
  const amb = ambienteDemo({ DEMO_MAX_VISITANTES: '5', DEMO_VISITANTES_POR_IP: '3', DEMO_VIDA_MINIMA_MINUTOS: '15' });
  for (let i = 0; i < 8; i++) assert.equal((await entrar(amb, '203.0.113.5')).status, 200);
  assert.equal((await entrar(amb, '198.51.100.1')).status, 200);
  assert.equal((await entrar(amb, '198.51.100.2')).status, 200);
  assert.equal(visitantes(amb).length, 5);
});

test('o cadastro com a demo ligada conta no mesmo limite por IP', async () => {
  const amb = ambienteDemo({ DEMO_VISITANTES_POR_IP: '2' });
  const primeira = (await entrar(amb, '203.0.113.5')).body.token;
  await entrar(amb, '203.0.113.5');
  const cadastro = await request(amb.app)
    .post('/api/auth/cadastro')
    .set('X-Forwarded-For', '203.0.113.5')
    .send({ nome: 'Rita Visitante', email: 'rita@exemplo.dev', senha: 'Senha456x', aceite_termos: true });
  assert.equal(cadastro.status, 201);
  assert.equal(await vivo(amb, primeira), false);
  assert.equal(visitantes(amb).length, 2);
});

test('horários criados pelo gestor demo têm teto por IP (DEMO_HORARIOS_POR_IP): um IP não esgota o teto dos outros', async () => {
  const amb = ambienteDemo({ DEMO_HORARIOS_POR_IP: '2', DEMO_MAX_HORARIOS: '500' });
  const { token } = (await entrar(amb, '203.0.113.5', 'gestor')).body;
  const criar = (ip, hora) =>
    request(amb.app)
      .post('/api/horarios')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Forwarded-For', ip)
      .send({ medico_id: 'demo-medico-1', data: '2030-02-20', hora });
  assert.equal((await criar('203.0.113.5', '07:00')).status, 201);
  assert.equal((await criar('203.0.113.5', '07:30')).status, 201);
  const cheio = await criar('203.0.113.5', '18:00');
  assert.equal(cheio.status, 409);
  assert.match(cheio.body.erro, /2 horários por visitante/);
  assert.equal((await criar('198.51.100.1', '18:30')).status, 201, 'outro IP continua criando');
});

test('tetos valem com pedidos em paralelo: 30 cadastros de médico simultâneos não passam de DEMO_MAX_MEDICOS', async () => {
  const amb = ambienteDemo({ DEMO_MAX_MEDICOS: '6' }); // 4 do cenário + 2
  const { token } = (await entrar(amb, '203.0.113.5', 'gestor')).body;
  const respostas = await Promise.all(
    Array.from({ length: 30 }, (_, i) =>
      request(amb.app)
        .post('/api/medicos')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Forwarded-For', `198.51.100.${i + 1}`)
        .send({ nome: `Dra. Paralela ${String.fromCharCode(65 + (i % 26))}${i}`, especialidade: 'Pediatria' })
    )
  );
  assert.equal(respostas.filter((r) => r.status === 201).length, 2);
  assert.equal(amb.dados().medicos.length, 6);
});

test('visitantes em paralelo, de 30 IPs, não passam do teto DEMO_MAX_VISITANTES', async () => {
  const amb = ambienteDemo({ DEMO_MAX_VISITANTES: '5', DEMO_VIDA_MINIMA_MINUTOS: '15' });
  const respostas = await Promise.all(Array.from({ length: 30 }, (_, i) => entrar(amb, `198.51.100.${i + 1}`)));
  assert.equal(respostas.filter((r) => r.status === 200).length, 5);
  assert.equal(respostas.filter((r) => r.status === 503).length, 25);
  assert.equal(visitantes(amb).length, 5);
});
