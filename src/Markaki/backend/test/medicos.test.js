// Médicos: qualquer usuário logado lista; só o gestor cadastra, edita e remove.
const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { criarAmbiente, usuarios, horario, agendamento } = require('./apoio');

const amb = criarAmbiente();
beforeEach(() => amb.semear());
after(() => amb.fechar());

test('paciente e gestor listam os médicos', async () => {
  for (const u of [usuarios.ana, usuarios.gestor]) {
    const res = await amb.como(u).get('/api/medicos');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.map((m) => m.id), ['m1', 'm2']);
  }
});

test('GET /api/medicos/:id inexistente responde 404', async () => {
  const res = await amb.como(usuarios.ana).get('/api/medicos/nao-existe');
  assert.equal(res.status, 404);
});

test('paciente não cadastra, edita nem remove médico (403)', async () => {
  const ana = amb.como(usuarios.ana);
  assert.equal((await ana.post('/api/medicos').send({ nome: 'Dr. Novo', especialidade: 'Pediatria' })).status, 403);
  assert.equal((await ana.put('/api/medicos/m1').send({ nome: 'Outro Nome' })).status, 403);
  assert.equal((await ana.delete('/api/medicos/m2')).status, 403);
  assert.equal(amb.dados().medicos.length, 2);
});

test('gestor cadastra médico com nome e especialidade sem espaços nas pontas', async () => {
  const res = await amb.como(usuarios.gestor).post('/api/medicos')
    .send({ nome: '  Dra. Nova  ', especialidade: ' Pediatria ' });
  assert.equal(res.status, 201);
  assert.equal(res.body.nome, 'Dra. Nova');
  assert.equal(res.body.especialidade, 'Pediatria');
  assert.equal(amb.dados().medicos.length, 3);
});

test('cadastro de médico valida tipo e tamanho dos campos (400)', async () => {
  const gestor = amb.como(usuarios.gestor);
  for (const corpo of [
    { especialidade: 'Pediatria' },
    { nome: 'Dr', especialidade: 'Pediatria' },
    { nome: { $ne: '' }, especialidade: 'Pediatria' },
    { nome: 'x'.repeat(81), especialidade: 'Pediatria' },
    { nome: 'Dra. Nova', especialidade: '' },
  ]) {
    const res = await gestor.post('/api/medicos').send(corpo);
    assert.equal(res.status, 400, JSON.stringify(corpo).slice(0, 60));
  }
});

test('editar médico muda o nome também na agenda e nas consultas ativas, não no histórico', async () => {
  amb.semear({
    horarios: [horario('h1'), horario('h2', 'm1', { hora: '10:00' })],
    agendamentos: [
      agendamento('a1', 'h1'),
      agendamento('a2', 'h2', 'u-bia', { status: 'cancelado', hora: '10:00', cancelado_em: '2030-01-06T10:00:00.000Z', cancelado_por: 'paciente' }),
    ],
  });
  const res = await amb.como(usuarios.gestor).put('/api/medicos/m1').send({ nome: 'Dra. Ana Lima Prado' });
  assert.equal(res.status, 200);
  assert.equal(res.body.nome, 'Dra. Ana Lima Prado');
  assert.equal(res.body.especialidade, 'Cardiologia');
  const horarios = await amb.como(usuarios.gestor).get('/api/horarios');
  assert.equal(horarios.body[0].medico_nome, 'Dra. Ana Lima Prado');
  const { agendamentos } = amb.dados();
  assert.equal(agendamentos.find((a) => a.id === 'a1').medico_nome, 'Dra. Ana Lima Prado');
  assert.equal(agendamentos.find((a) => a.id === 'a2').medico_nome, 'Dra. Ana Lima');
});

test('editar médico inexistente responde 404', async () => {
  const res = await amb.como(usuarios.gestor).put('/api/medicos/nao-existe').send({ nome: 'Dr. Ninguém' });
  assert.equal(res.status, 404);
});

test('médico com consulta futura não pode ser removido (409)', async () => {
  amb.semear({ horarios: [horario('h1')], agendamentos: [agendamento('a1', 'h1')] });
  const res = await amb.como(usuarios.gestor).delete('/api/medicos/m1');
  assert.equal(res.status, 409);
  assert.match(res.body.erro, /cancele/i);
  assert.equal(amb.dados().medicos.length, 2);
});

test('remover médico apaga a agenda dele e mantém o histórico de consultas', async () => {
  amb.semear({
    horarios: [horario('h1'), horario('h2', 'm1', { hora: '10:00', bloqueado: true }), horario('h3', 'm2')],
    agendamentos: [agendamento('a1', 'h1', 'u-ana', { status: 'cancelado', cancelado_em: '2030-01-06T10:00:00.000Z', cancelado_por: 'paciente' })],
  });
  const res = await amb.como(usuarios.gestor).delete('/api/medicos/m1');
  assert.equal(res.status, 200);
  assert.equal(res.body.horarios_removidos, 2);
  const dados = amb.dados();
  assert.deepEqual(dados.medicos.map((m) => m.id), ['m2']);
  assert.deepEqual(dados.horarios.map((h) => h.id), ['h3']);
  assert.equal(dados.agendamentos.length, 1);
  assert.equal(dados.agendamentos[0].medico_nome, 'Dra. Ana Lima');
});
