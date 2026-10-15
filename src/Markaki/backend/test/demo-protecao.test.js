// Modo demonstração: o gestor é compartilhado por todos os visitantes, então o
// cenário de exemplo (ids demo-*) não pode ser apagado nem desfigurado, e o que
// cada visitante cria tem teto.
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { lerConfig } = require('../src/config');
const { resetarDemonstracao } = require('../src/services/demonstracao');
const { criarAmbiente, AGORA, usuarios, horario } = require('./apoio');

const BASE = { JWT_SECRET: 'x'.repeat(32), BCRYPT_CUSTO: '4' };
const ambientes = [];
after(() => ambientes.forEach((a) => a.fechar()));

function ambienteDemo(envExtra = {}) {
  const config = lerConfig({ ...BASE, DEMO_ENABLED: 'true', ...envExtra });
  const amb = criarAmbiente({ demo: config.demo });
  ambientes.push(amb);
  amb.semear({ usuarios: [], medicos: [] });
  resetarDemonstracao(amb.armazenamento, config, AGORA);
  return amb;
}

async function sessao(amb, papel) {
  const res = await request(amb.app).post('/api/demo/entrar').send({ papel });
  const auth = { Authorization: `Bearer ${res.body.token}` };
  const com = (metodo) => (url) => request(amb.app)[metodo](url).set(auth);
  return { get: com('get'), post: com('post'), put: com('put'), patch: com('patch'), delete: com('delete') };
}

// Um horário de exemplo livre (sem consulta ativa e sem bloqueio).
function horarioDoCenario(amb) {
  const { horarios, agendamentos } = amb.dados();
  const ocupados = new Set(agendamentos.filter((a) => a.status === 'agendado').map((a) => a.horario_id));
  return horarios.find((h) => h.id.startsWith('demo-medico-1-') && !h.bloqueado && !ocupados.has(h.id));
}

test('médicos de exemplo não saem nem mudam de nome; os criados pelo visitante, sim', async () => {
  const amb = ambienteDemo();
  const gestor = await sessao(amb, 'gestor');
  const remover = await gestor.delete('/api/medicos/demo-medico-4');
  assert.equal(remover.status, 403);
  assert.match(remover.body.erro, /demonstração/);
  assert.equal((await gestor.put('/api/medicos/demo-medico-4').send({ nome: 'Dr. Trocado' })).status, 403);
  assert.ok(amb.dados().medicos.some((m) => m.id === 'demo-medico-4' && m.nome === 'Dr. André Lacerda'));

  const novo = await gestor.post('/api/medicos').send({ nome: 'Dra. Nova Visitante', especialidade: 'Pediatria' });
  assert.equal(novo.status, 201);
  assert.equal((await gestor.put(`/api/medicos/${novo.body.id}`).send({ nome: 'Dra. Nova Editada' })).status, 200);
  assert.equal((await gestor.delete(`/api/medicos/${novo.body.id}`)).status, 200);
});

test('horários de exemplo não saem nem mudam de data, mas podem ser bloqueados e liberados', async () => {
  const amb = ambienteDemo();
  const gestor = await sessao(amb, 'gestor');
  const h = horarioDoCenario(amb);
  const remover = await gestor.delete(`/api/horarios/${h.id}`);
  assert.equal(remover.status, 403);
  assert.match(remover.body.erro, /bloquear/);
  assert.equal((await gestor.put(`/api/horarios/${h.id}`).send({ hora: '07:00' })).status, 403);
  assert.equal((await gestor.put(`/api/horarios/${h.id}`).send({ bloqueado: true })).status, 200);
  assert.equal((await gestor.put(`/api/horarios/${h.id}`).send({ bloqueado: false })).status, 200);
});

test('a clínica demo não cancela as consultas de exemplo; a visitante cancela as dela', async () => {
  const amb = ambienteDemo();
  const gestor = await sessao(amb, 'gestor');
  const doCenario = amb.dados().agendamentos.find((a) => a.status === 'agendado' && a.data > '2030-01-10');
  assert.match(doCenario.id, /^demo-/);
  const res = await gestor.patch(`/api/agendamentos/${doCenario.id}/cancelar`);
  assert.equal(res.status, 403);
  assert.match(res.body.erro, /paciente/);

  const paciente = await sessao(amb, 'paciente');
  const minhas = (await paciente.get('/api/agendamentos')).body;
  const futura = minhas.find((c) => c.situacao === 'agendado');
  assert.equal((await paciente.patch(`/api/agendamentos/${futura.id}/cancelar`)).status, 200);
});

test('teto de médicos e de horários na demonstração (409 com mensagem clara)', async () => {
  const amb = ambienteDemo({ DEMO_MAX_MEDICOS: '5', DEMO_MAX_HORARIOS: String(242) });
  assert.equal(amb.dados().horarios.length, 241);
  const gestor = await sessao(amb, 'gestor');
  const medico = (nome) => gestor.post('/api/medicos').send({ nome, especialidade: 'Pediatria' });
  assert.equal((await medico('Dra. Quinta Medica')).status, 201);
  const cheio = await medico('Dr. Sexto Medico');
  assert.equal(cheio.status, 409);
  assert.match(cheio.body.erro, /até 5 médicos/);

  const novo = (hora) => gestor.post('/api/horarios').send({ medico_id: 'demo-medico-1', data: '2030-03-01', hora });
  assert.equal((await novo('08:00')).status, 201);
  const lotado = await novo('09:00');
  assert.equal(lotado.status, 409);
  assert.match(lotado.body.erro, /até 242 horários/);
});

test('fora do modo demonstração nada disso vale (ids demo-* são ids comuns)', async () => {
  const amb = criarAmbiente();
  ambientes.push(amb);
  amb.semear({
    medicos: [{ id: 'demo-medico-9', nome: 'Dr. Comum Teste', especialidade: 'Pediatria' }],
    horarios: [horario('demo-h-1', 'demo-medico-9')],
  });
  const gestor = amb.como(usuarios.gestor);
  assert.equal((await gestor.delete('/api/horarios/demo-h-1')).status, 200);
  assert.equal((await gestor.delete('/api/medicos/demo-medico-9')).status, 200);
});

test('listagens têm limite (LIMITE_LISTAGEM): a clínica recebe as mais recentes, a paciente as mais próximas', async () => {
  const amb = criarAmbiente({ limiteListagem: 5 });
  ambientes.push(amb);
  const dias = ['2030-02-01', '2030-02-02', '2030-02-03', '2030-02-04', '2030-02-05', '2030-02-06', '2030-02-07'];
  amb.semear({ horarios: dias.map((data, i) => horario(`h${i}`, 'm1', { data })) });
  assert.equal(lerConfig(BASE).limiteListagem, 500);

  const daClinica = (await amb.como(usuarios.gestor).get('/api/horarios')).body.map((h) => h.data);
  assert.deepEqual(daClinica, dias.slice(2));
  const daPaciente = (await amb.como(usuarios.ana).get('/api/horarios')).body.map((h) => h.data);
  assert.deepEqual(daPaciente, dias.slice(0, 5));
  const doMedico = (await amb.como(usuarios.gestor).get('/api/horarios?medico_id=m1')).body;
  assert.equal(doMedico.length, 5);
});

test('lista de consultas da clínica tem limite e traz as mais recentes, em ordem de data', async () => {
  const { agendamento } = require('./apoio');
  const amb = criarAmbiente({ limiteListagem: 3 });
  ambientes.push(amb);
  const dias = ['2030-01-02', '2030-01-03', '2030-02-01', '2030-02-02', '2030-02-03'];
  amb.semear({
    agendamentos: dias.map((data, i) => agendamento(`a${i}`, null, i % 2 ? 'u-bia' : 'u-ana', { data })),
  });
  const lista = (await amb.como(usuarios.gestor).get('/api/agendamentos')).body.map((a) => a.data);
  assert.deepEqual(lista, dias.slice(2));
});
