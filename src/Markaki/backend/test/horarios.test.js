// Agenda: cada horário pertence a um médico; o gestor cadastra, bloqueia e remove;
// a paciente só vê horários livres e futuros, sem dados de outras pessoas.
const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { criarAmbiente, usuarios, horario, agendamento } = require('./apoio');

const amb = criarAmbiente();
beforeEach(() => amb.semear());
after(() => amb.fechar());
const gestor = () => amb.como(usuarios.gestor);

test('gestor cadastra horário na agenda do médico', async () => {
  const res = await gestor().post('/api/horarios').send({ medico_id: 'm1', data: '2030-02-01', hora: '09:00' });
  assert.equal(res.status, 201);
  assert.equal(res.body.medico_id, 'm1');
  assert.equal(res.body.medico_nome, 'Dra. Ana Lima');
  assert.equal(res.body.disponivel, true);
  assert.equal(res.body.bloqueado, false);
});

test('paciente não mexe na agenda (403)', async () => {
  amb.semear({ horarios: [horario('h1')] });
  const ana = amb.como(usuarios.ana);
  assert.equal((await ana.post('/api/horarios').send({ medico_id: 'm1', data: '2030-02-01', hora: '10:00' })).status, 403);
  assert.equal((await ana.put('/api/horarios/h1').send({ bloqueado: true })).status, 403);
  assert.equal((await ana.delete('/api/horarios/h1')).status, 403);
});

test('horário exige médico existente, data AAAA-MM-DD real e hora HH:MM (400)', async () => {
  for (const corpo of [
    { data: '2030-02-01', hora: '09:00' },
    { medico_id: 'nao-existe', data: '2030-02-01', hora: '09:00' },
    { medico_id: 'm1', data: '01/02/2030', hora: '09:00' },
    { medico_id: 'm1', data: '2030-02-30', hora: '09:00' },
    { medico_id: 'm1', data: '2030-02-01', hora: '9h' },
    { medico_id: 'm1', data: '2030-02-01', hora: '24:00' },
    { medico_id: 'm1', data: 20300201, hora: '09:00' },
    { medico_id: 'm1', data: '2030-02-01', hora: '09:00', bloqueado: 'sim' },
  ]) {
    const res = await gestor().post('/api/horarios').send(corpo);
    assert.equal(res.status, 400, JSON.stringify(corpo));
  }
  assert.equal(amb.dados().horarios.length, 0);
});

test('horário no passado é recusado (400)', async () => {
  const ontem = await gestor().post('/api/horarios').send({ medico_id: 'm1', data: '2030-01-09', hora: '15:00' });
  const hojeCedo = await gestor().post('/api/horarios').send({ medico_id: 'm1', data: '2030-01-10', hora: '11:30' });
  assert.equal(ontem.status, 400);
  assert.equal(hojeCedo.status, 400);
  const hojeTarde = await gestor().post('/api/horarios').send({ medico_id: 'm1', data: '2030-01-10', hora: '14:00' });
  assert.equal(hojeTarde.status, 201);
});

test('o mesmo médico não repete horário (409), mas dois médicos podem', async () => {
  const corpo = { data: '2030-02-01', hora: '09:00' };
  assert.equal((await gestor().post('/api/horarios').send({ ...corpo, medico_id: 'm1' })).status, 201);
  assert.equal((await gestor().post('/api/horarios').send({ ...corpo, medico_id: 'm2' })).status, 201);
  assert.equal((await gestor().post('/api/horarios').send({ ...corpo, medico_id: 'm1', hora: ' 09:00 ' })).status, 409);
});

test('lista filtra por médico e vem ordenada por data e hora', async () => {
  amb.semear({
    horarios: [
      horario('h3', 'm1', { data: '2030-02-02', hora: '08:00' }),
      horario('h1', 'm1', { hora: '10:00' }),
      horario('h2', 'm2'),
      horario('h0', 'm1', { hora: '08:30' }),
    ],
  });
  const res = await gestor().get('/api/horarios').query({ medico_id: 'm1' });
  assert.deepEqual(res.body.map((h) => h.id), ['h0', 'h1', 'h3']);
});

test('paciente vê só horários livres e futuros, sem nome de outra paciente', async () => {
  amb.semear({
    horarios: [
      horario('livre'),
      horario('ocupado', 'm1', { hora: '10:00' }),
      horario('bloqueado', 'm1', { hora: '11:00', bloqueado: true }),
      horario('passado', 'm1', { data: '2030-01-09' }),
    ],
    agendamentos: [agendamento('a1', 'ocupado', 'u-bia', { hora: '10:00' })],
  });
  const res = await amb.como(usuarios.ana).get('/api/horarios');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.map((h) => h.id), ['livre']);
  assert.equal(res.body[0].paciente_nome, undefined);
  assert.equal(res.body[0].bloqueado, undefined);
});

test('gestor vê o estado de cada horário e quem agendou', async () => {
  amb.semear({
    horarios: [horario('livre'), horario('ocupado', 'm1', { hora: '10:00' }), horario('bloqueado', 'm1', { hora: '11:00', bloqueado: true })],
    agendamentos: [agendamento('a1', 'ocupado', 'u-bia', { hora: '10:00' })],
  });
  const res = await gestor().get('/api/horarios');
  const porId = Object.fromEntries(res.body.map((h) => [h.id, h]));
  assert.equal(porId.livre.disponivel, true);
  assert.equal(porId.ocupado.disponivel, false);
  assert.equal(porId.ocupado.agendado, true);
  assert.equal(porId.ocupado.paciente_nome, 'Bia Paciente');
  assert.equal(porId.bloqueado.disponivel, false);
  assert.equal(porId.bloqueado.bloqueado, true);
});

test('bloquear e desbloquear horário livre', async () => {
  amb.semear({ horarios: [horario('h1')] });
  const bloqueio = await gestor().put('/api/horarios/h1').send({ bloqueado: true });
  assert.equal(bloqueio.status, 200);
  assert.equal(bloqueio.body.disponivel, false);
  const volta = await gestor().put('/api/horarios/h1').send({ bloqueado: false });
  assert.equal(volta.body.disponivel, true);
});

test('horário agendado não é bloqueado, editado nem removido (409)', async () => {
  amb.semear({ horarios: [horario('h1')], agendamentos: [agendamento('a1', 'h1')] });
  assert.equal((await gestor().put('/api/horarios/h1').send({ bloqueado: true })).status, 409);
  assert.equal((await gestor().put('/api/horarios/h1').send({ hora: '15:00' })).status, 409);
  assert.equal((await gestor().delete('/api/horarios/h1')).status, 409);
  assert.equal(amb.dados().horarios.length, 1);
});

test('edição aceita só bloqueado, data e hora (400) e não repete horário (409)', async () => {
  amb.semear({ horarios: [horario('h1'), horario('h2', 'm1', { hora: '10:00' })] });
  const intruso = await gestor().put('/api/horarios/h1').send({ medico_id: 'm2', paciente_nome: 'X' });
  assert.equal(intruso.status, 400);
  assert.match(intruso.body.erro, /paciente_nome/);
  const repetido = await gestor().put('/api/horarios/h2').send({ hora: '09:00' });
  assert.equal(repetido.status, 409);
  const movido = await gestor().put('/api/horarios/h2').send({ data: '2030-02-03', hora: '16:30' });
  assert.equal(movido.status, 200);
  assert.equal(movido.body.hora, '16:30');
});

test('remover horário livre; o histórico cancelado dele continua', async () => {
  amb.semear({
    horarios: [horario('h1')],
    agendamentos: [agendamento('a1', 'h1', 'u-ana', { status: 'cancelado', cancelado_em: '2030-01-06T10:00:00.000Z', cancelado_por: 'paciente' })],
  });
  const res = await gestor().delete('/api/horarios/h1');
  assert.equal(res.status, 200);
  const dados = amb.dados();
  assert.equal(dados.horarios.length, 0);
  assert.equal(dados.agendamentos.length, 1);
  assert.equal(dados.agendamentos[0].data, '2030-02-01');
});

test('paciente não abre horário livre que já passou (404)', async () => {
  amb.semear({ horarios: [horario('velho', 'm1', { data: '2030-01-09' }), horario('novo')] });
  assert.equal((await amb.como(usuarios.ana).get('/api/horarios/velho')).status, 404);
  assert.equal((await amb.como(usuarios.ana).get('/api/horarios/novo')).status, 200);
});

test('edição sem nenhum campo responde 400', async () => {
  amb.semear({ horarios: [horario('h1')] });
  assert.equal((await gestor().put('/api/horarios/h1').send({})).status, 400);
});

test('GET /api/horarios/:id inexistente responde 404', async () => {
  assert.equal((await gestor().get('/api/horarios/nada')).status, 404);
});
