// Agendamentos: a paciente agenda para si (o id vem do token), vê só os seus e
// cancela; o cancelamento é lógico e fica no histórico. O banco garante um
// agendamento ativo por horário mesmo sob concorrência.
const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { criarAmbiente, usuarios, horario, agendamento } = require('./apoio');

const amb = criarAmbiente();
beforeEach(() => amb.semear({ horarios: [horario('h1'), horario('h2', 'm2', { hora: '10:00' })] }));
after(() => amb.fechar());
const ana = () => amb.como(usuarios.ana);

test('paciente agenda: paciente vem do token e o horário fica ocupado', async () => {
  const res = await ana()
    .post('/api/agendamentos')
    .send({ horario_id: 'h1', paciente_id: 'u-bia', paciente_nome: 'Outra Pessoa' });
  assert.equal(res.status, 201);
  assert.equal(res.body.paciente_id, 'u-ana');
  assert.equal(res.body.paciente_nome, 'Ana Paciente');
  assert.equal(res.body.medico_nome, 'Dra. Ana Lima');
  assert.equal(res.body.situacao, 'agendado');
  const livres = await ana().get('/api/horarios');
  assert.deepEqual(
    livres.body.map((h) => h.id),
    ['h2']
  );
});

test('gestor não agenda em nome de paciente (403)', async () => {
  const res = await amb.como(usuarios.gestor).post('/api/agendamentos').send({ horario_id: 'h1' });
  assert.equal(res.status, 403);
});

test('agendar exige horário existente (404), livre (409), futuro (400) e do médico informado (400)', async () => {
  amb.semear({
    horarios: [
      horario('h1'),
      horario('bloq', 'm1', { hora: '11:00', bloqueado: true }),
      horario('velho', 'm1', { data: '2030-01-09' }),
    ],
  });
  assert.equal((await ana().post('/api/agendamentos').send({})).status, 400);
  assert.equal((await ana().post('/api/agendamentos').send({ horario_id: 'nada' })).status, 404);
  assert.equal((await ana().post('/api/agendamentos').send({ horario_id: 'bloq' })).status, 409);
  assert.equal((await ana().post('/api/agendamentos').send({ horario_id: 'velho' })).status, 400);
  assert.equal((await ana().post('/api/agendamentos').send({ horario_id: 'h1', medico_id: 'm2' })).status, 400);
  assert.equal(amb.dados().agendamentos.length, 0);
});

test('horário já agendado por outra paciente responde 409', async () => {
  await amb.como(usuarios.bia).post('/api/agendamentos').send({ horario_id: 'h1' });
  const res = await ana().post('/api/agendamentos').send({ horario_id: 'h1' });
  assert.equal(res.status, 409);
});

test('paciente não tem duas consultas no mesmo dia e hora (409)', async () => {
  amb.semear({ horarios: [horario('h1'), horario('h1b', 'm2')] });
  assert.equal((await ana().post('/api/agendamentos').send({ horario_id: 'h1' })).status, 201);
  const res = await ana().post('/api/agendamentos').send({ horario_id: 'h1b' });
  assert.equal(res.status, 409);
});

test('agendamentos simultâneos no mesmo horário: só um é aceito', async () => {
  const pacientes = Array.from({ length: 10 }, (_, i) => ({
    id: `u-p${i}`,
    nome: `Paciente ${i}`,
    email: `p${i}@teste.dev`,
    papel: 'paciente',
  }));
  const dados = amb.dados();
  amb.semear({
    usuarios: [
      ...dados.usuarios,
      ...pacientes.map((p) => ({ ...p, telefone: '', senha_hash: 'x', criado_em: '2030-01-01T00:00:00.000Z' })),
    ],
    horarios: [horario('h1')],
  });
  const respostas = await Promise.all(
    pacientes.map((p) =>
      request(amb.app)
        .post('/api/agendamentos')
        .set('Authorization', `Bearer ${amb.token(p)}`)
        .send({ horario_id: 'h1' })
    )
  );
  const status = respostas.map((r) => r.status).sort();
  assert.deepEqual(status, [201, ...Array(9).fill(409)]);
  assert.equal(amb.dados().agendamentos.length, 1);
});

test('paciente vê só os próprios agendamentos; gestor vê todos', async () => {
  amb.semear({
    horarios: [horario('h1'), horario('h2', 'm1', { hora: '10:00' })],
    agendamentos: [agendamento('a1', 'h1'), agendamento('a2', 'h2', 'u-bia', { hora: '10:00' })],
  });
  const minha = await ana().get('/api/agendamentos');
  assert.deepEqual(
    minha.body.map((a) => a.id),
    ['a1']
  );
  const todos = await amb.como(usuarios.gestor).get('/api/agendamentos');
  assert.deepEqual(todos.body.map((a) => a.id).sort(), ['a1', 'a2']);
});

test('paciente não abre nem cancela agendamento de outra (404)', async () => {
  amb.semear({ horarios: [horario('h1')], agendamentos: [agendamento('a1', 'h1', 'u-bia')] });
  assert.equal((await ana().get('/api/agendamentos/a1')).status, 404);
  assert.equal((await ana().patch('/api/agendamentos/a1/cancelar')).status, 404);
  assert.equal(amb.dados().agendamentos[0].status, 'agendado');
});

test('cancelar é lógico: fica no histórico e o horário volta a ficar livre', async () => {
  const criado = await ana().post('/api/agendamentos').send({ horario_id: 'h1' });
  const res = await ana().patch(`/api/agendamentos/${criado.body.id}/cancelar`);
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'cancelado');
  assert.equal(res.body.situacao, 'cancelado');
  assert.equal(res.body.cancelado_por, 'paciente');
  assert.ok(res.body.cancelado_em);
  const historico = await ana().get('/api/agendamentos');
  assert.equal(historico.body.length, 1);
  const livres = await ana().get('/api/horarios');
  assert.ok(livres.body.some((h) => h.id === 'h1'));
  // E o horário pode ser agendado de novo.
  assert.equal((await ana().post('/api/agendamentos').send({ horario_id: 'h1' })).status, 201);
});

test('gestor cancela qualquer agendamento; cancelar duas vezes responde 409', async () => {
  amb.semear({ horarios: [horario('h1')], agendamentos: [agendamento('a1', 'h1')] });
  const res = await amb.como(usuarios.gestor).patch('/api/agendamentos/a1/cancelar');
  assert.equal(res.status, 200);
  assert.equal(res.body.cancelado_por, 'gestor');
  assert.equal((await amb.como(usuarios.gestor).patch('/api/agendamentos/a1/cancelar')).status, 409);
});

test('consulta que já passou não é cancelada (409) e aparece como realizada', async () => {
  amb.semear({
    horarios: [horario('h1', 'm1', { data: '2030-01-09' })],
    agendamentos: [agendamento('a1', 'h1', 'u-ana', { data: '2030-01-09' })],
  });
  assert.equal((await ana().patch('/api/agendamentos/a1/cancelar')).status, 409);
  const res = await ana().get('/api/agendamentos/a1');
  assert.equal(res.body.situacao, 'realizado');
});

test('DELETE de agendamento não existe mais (o cancelamento é PATCH)', async () => {
  amb.semear({ horarios: [horario('h1')], agendamentos: [agendamento('a1', 'h1')] });
  const res = await ana().delete('/api/agendamentos/a1');
  assert.equal(res.status, 404);
  assert.equal(amb.dados().agendamentos.length, 1);
});

test('erro no meio de uma escrita desfaz tudo o que a operação já tinha feito', async () => {
  await assert.rejects(
    amb.armazenamento.escrita((r) => {
      r.medicos.inserir({ id: 'm3', nome: 'Dr. Caio Dias', especialidade: 'Pediatria' });
      throw new Error('falha simulada');
    }),
    /falha simulada/
  );
  assert.deepEqual(
    amb.dados().medicos.map((m) => m.id),
    ['m1', 'm2']
  );
});

test('o banco recusa dois agendamentos ativos no mesmo horário, mesmo fora do serviço', async () => {
  await amb.armazenamento.escrita((r) => r.agendamentos.inserir(agendamento('a1', 'h1')));
  await assert.rejects(
    amb.armazenamento.escrita((r) => r.agendamentos.inserir(agendamento('a2', 'h1', 'u-bia'))),
    /UNIQUE/
  );
  assert.equal(amb.dados().agendamentos.length, 1);
});

test('painel do gestor resume o dia e a semana; paciente não acessa (403)', async () => {
  amb.semear({
    horarios: [
      horario('hoje1', 'm1', { data: '2030-01-10', hora: '15:00' }),
      horario('hoje2', 'm2', { data: '2030-01-10', hora: '16:00' }),
      horario('semana', 'm1', { data: '2030-01-14', hora: '09:00' }),
      horario('livre', 'm1', { data: '2030-01-15', hora: '09:00' }),
    ],
    agendamentos: [
      agendamento('a1', 'hoje1', 'u-ana', { data: '2030-01-10', hora: '15:00' }),
      agendamento('a2', 'semana', 'u-bia', { data: '2030-01-14', hora: '09:00' }),
    ],
  });
  assert.equal((await ana().get('/api/painel')).status, 403);
  const res = await amb.como(usuarios.gestor).get('/api/painel');
  assert.equal(res.status, 200);
  assert.equal(res.body.consultas_hoje, 1);
  assert.equal(res.body.consultas_7_dias, 2);
  assert.equal(res.body.horarios_livres, 2);
  assert.equal(res.body.medicos, 2);
  assert.deepEqual(
    res.body.agenda_de_hoje.map((a) => a.id),
    ['a1']
  );
});

test('paciente tem no máximo 3 consultas futuras ativas (evita reservar a agenda toda)', async () => {
  amb.semear({
    horarios: ['08:00', '09:00', '10:00', '11:00'].map((hora, i) => horario(`h${i}`, 'm1', { hora })),
  });
  for (let i = 0; i < 3; i++) {
    assert.equal(
      (
        await ana()
          .post('/api/agendamentos')
          .send({ horario_id: `h${i}` })
      ).status,
      201
    );
  }
  const quarta = await ana().post('/api/agendamentos').send({ horario_id: 'h3' });
  assert.equal(quarta.status, 409);
  assert.match(quarta.body.erro, /3 consultas/);
  // Cancelando uma, abre espaço.
  const [primeira] = (await ana().get('/api/agendamentos')).body;
  await ana().patch(`/api/agendamentos/${primeira.id}/cancelar`);
  assert.equal((await ana().post('/api/agendamentos').send({ horario_id: 'h3' })).status, 201);
});
