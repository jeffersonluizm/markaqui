// Testes das rotas da API. Rodam contra um arquivo de dados temporário (DATA_FILE),
// nunca contra o database.json real.
const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

const pastaTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'markaki-api-'));
const arquivoDados = path.join(pastaTemp, 'database.json');
process.env.DATA_FILE = arquivoDados;

const { app, gerarId } = require('./server');

const medicosBase = [
  { id: 'm1', nome: 'Dra. Ana', especialidade: 'Cardiologista', imagem: '' },
  { id: 'm2', nome: 'Dr. Beto', especialidade: 'Ortopedista', imagem: '' },
];

function gravarDados(dados) {
  fs.writeFileSync(
    arquivoDados,
    JSON.stringify({ medicos: [], horarios: [], agendamentos: [], ...dados }, null, 2)
  );
}

function lerDados() {
  return JSON.parse(fs.readFileSync(arquivoDados, 'utf8'));
}

beforeEach(() => {
  gravarDados({ medicos: medicosBase });
});

after(() => {
  fs.rmSync(pastaTemp, { recursive: true, force: true });
});

test('usa o arquivo de dados indicado em DATA_FILE', async () => {
  const res = await request(app).get('/api/medicos');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.map((m) => m.id), ['m1', 'm2']);
});

test('gerarId não repete mesmo quando chamado várias vezes no mesmo milissegundo', () => {
  const ids = new Set(Array.from({ length: 1000 }, () => gerarId()));
  assert.equal(ids.size, 1000);
});

// ============================================
// HORÁRIOS POR MÉDICO
// ============================================

test('POST /api/horarios sem medico_id responde 400', async () => {
  const res = await request(app)
    .post('/api/horarios')
    .send({ data: '2025-11-25', hora: '09:00 - 10:00' });
  assert.equal(res.status, 400);
  assert.match(res.body.erro, /médico/i);
  assert.equal(lerDados().horarios.length, 0);
});

test('POST /api/horarios com médico inexistente responde 400', async () => {
  const res = await request(app)
    .post('/api/horarios')
    .send({ data: '2025-11-25', hora: '09:00 - 10:00', medico_id: 'nao-existe' });
  assert.equal(res.status, 400);
  assert.equal(lerDados().horarios.length, 0);
});

test('POST /api/horarios grava o médico do horário', async () => {
  const res = await request(app)
    .post('/api/horarios')
    .send({ data: '2025-11-25', hora: '09:00 - 10:00', medico_id: 'm1' });
  assert.equal(res.status, 201);
  assert.equal(res.body.medico_id, 'm1');
  assert.equal(res.body.medico_nome, 'Dra. Ana');
  assert.equal(res.body.disponivel, true);
  assert.equal(lerDados().horarios[0].medico_id, 'm1');
});

test('dois médicos podem ter o mesmo horário', async () => {
  const corpo = { data: '2025-11-25', hora: '09:00 - 10:00' };
  const a = await request(app).post('/api/horarios').send({ ...corpo, medico_id: 'm1' });
  const b = await request(app).post('/api/horarios').send({ ...corpo, medico_id: 'm2' });
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);
  assert.equal(lerDados().horarios.length, 2);
});

test('o mesmo médico não pode ter o mesmo horário duas vezes (409)', async () => {
  const corpo = { data: '2025-11-25', hora: '09:00 - 10:00', medico_id: 'm1' };
  await request(app).post('/api/horarios').send(corpo);
  const res = await request(app).post('/api/horarios').send(corpo);
  assert.equal(res.status, 409);
  assert.equal(lerDados().horarios.length, 1);
});

test('GET /api/horarios?medico_id= devolve só os horários do médico', async () => {
  gravarDados({
    medicos: medicosBase,
    horarios: [
      { id: 'h1', data: '2025-11-25', hora: '09:00', disponivel: true, paciente_nome: '', medico_id: 'm1', medico_nome: 'Dra. Ana' },
      { id: 'h2', data: '2025-11-25', hora: '09:00', disponivel: true, paciente_nome: '', medico_id: 'm2', medico_nome: 'Dr. Beto' },
      { id: 'h3', data: '2025-11-26', hora: '10:00', disponivel: true, paciente_nome: '', medico_id: 'm1', medico_nome: 'Dra. Ana' },
    ],
  });
  const res = await request(app).get('/api/horarios').query({ medico_id: 'm1' });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.map((h) => h.id), ['h1', 'h3']);

  const todos = await request(app).get('/api/horarios');
  assert.equal(todos.body.length, 3);
});

// ============================================
// AGENDAMENTO USA O MÉDICO DO HORÁRIO
// ============================================

function horarioLivre(id, medico) {
  return {
    id,
    data: '2025-11-25',
    hora: '09:00 - 10:00',
    disponivel: true,
    paciente_nome: '',
    medico_id: medico ? medico.id : null,
    medico_nome: medico ? medico.nome : '',
  };
}

test('agendar com médico diferente do médico do horário responde 400', async () => {
  gravarDados({ medicos: medicosBase, horarios: [horarioLivre('h1', medicosBase[0])] });
  const res = await request(app)
    .post('/api/agendamentos')
    .send({ horario_id: 'h1', medico_id: 'm2', paciente_nome: 'Maria' });
  assert.equal(res.status, 400);
  const dados = lerDados();
  assert.equal(dados.agendamentos.length, 0);
  assert.equal(dados.horarios[0].disponivel, true);
});

test('agendar sem informar médico usa o médico do horário', async () => {
  gravarDados({ medicos: medicosBase, horarios: [horarioLivre('h1', medicosBase[0])] });
  const res = await request(app)
    .post('/api/agendamentos')
    .send({ horario_id: 'h1', paciente_nome: 'Maria' });
  assert.equal(res.status, 201);
  assert.equal(res.body.medico_id, 'm1');
  assert.equal(res.body.medico_nome, 'Dra. Ana');
  assert.equal(lerDados().horarios[0].paciente_nome, 'Maria');
});

test('horário antigo sem médico não pode ser agendado (400)', async () => {
  gravarDados({ medicos: medicosBase, horarios: [horarioLivre('h1', null)] });
  const res = await request(app)
    .post('/api/agendamentos')
    .send({ horario_id: 'h1', medico_id: 'm1', paciente_nome: 'Maria' });
  assert.equal(res.status, 400);
  assert.equal(lerDados().agendamentos.length, 0);
});

test('cancelar agendamento libera o horário e mantém o médico dele', async () => {
  gravarDados({ medicos: medicosBase, horarios: [horarioLivre('h1', medicosBase[0])] });
  const criado = await request(app)
    .post('/api/agendamentos')
    .send({ horario_id: 'h1', medico_id: 'm1', paciente_nome: 'Maria' });
  const res = await request(app).delete(`/api/agendamentos/${criado.body.id}`);
  assert.equal(res.status, 200);
  const [horario] = lerDados().horarios;
  assert.equal(horario.disponivel, true);
  assert.equal(horario.paciente_nome, '');
  assert.equal(horario.medico_id, 'm1');
  assert.equal(horario.medico_nome, 'Dra. Ana');
});

// ============================================
// EXCLUIR MÉDICO
// ============================================

test('DELETE /api/medicos/:id com agendamento responde 409 e não remove nada', async () => {
  gravarDados({
    medicos: medicosBase,
    horarios: [{ ...horarioLivre('h1', medicosBase[0]), disponivel: false, paciente_nome: 'Maria' }],
    agendamentos: [{ id: 'a1', horario_id: 'h1', medico_id: 'm1', paciente_nome: 'Maria', status: 'agendado' }],
  });
  const res = await request(app).delete('/api/medicos/m1');
  assert.equal(res.status, 409);
  assert.match(res.body.erro, /cancele os agendamentos primeiro/i);
  const dados = lerDados();
  assert.equal(dados.medicos.length, 2);
  assert.equal(dados.horarios.length, 1);
});

test('DELETE /api/medicos/:id sem agendamento remove o médico e os horários livres dele', async () => {
  gravarDados({
    medicos: medicosBase,
    horarios: [
      horarioLivre('h1', medicosBase[0]),
      { ...horarioLivre('h2', medicosBase[0]), disponivel: false },
      horarioLivre('h3', medicosBase[1]),
    ],
  });
  const res = await request(app).delete('/api/medicos/m1');
  assert.equal(res.status, 200);
  assert.equal(res.body.horarios_removidos, 2);
  const dados = lerDados();
  assert.deepEqual(dados.medicos.map((m) => m.id), ['m2']);
  assert.deepEqual(dados.horarios.map((h) => h.id), ['h3']);
});

// ============================================
// EDITAR / REMOVER HORÁRIO
// ============================================

function dadosComAgendamento() {
  return {
    medicos: medicosBase,
    horarios: [{ ...horarioLivre('h1', medicosBase[0]), disponivel: false, paciente_nome: 'Maria' }],
    agendamentos: [{ id: 'a1', horario_id: 'h1', medico_id: 'm1', paciente_nome: 'Maria', status: 'agendado' }],
  };
}

test('PUT /api/horarios/:id recusa campos que não são editáveis (400)', async () => {
  gravarDados({ medicos: medicosBase, horarios: [horarioLivre('h1', medicosBase[0])] });
  const res = await request(app)
    .put('/api/horarios/h1')
    .send({ disponivel: false, paciente_nome: 'Intruso', medico_id: 'm2' });
  assert.equal(res.status, 400);
  assert.match(res.body.erro, /paciente_nome/);
  assert.deepEqual(lerDados().horarios[0], horarioLivre('h1', medicosBase[0]));
});

test('PUT /api/horarios/:id altera disponivel, data e hora', async () => {
  gravarDados({ medicos: medicosBase, horarios: [horarioLivre('h1', medicosBase[0])] });
  const res = await request(app)
    .put('/api/horarios/h1')
    .send({ disponivel: false, data: '2025-12-01', hora: '11:00 - 12:00' });
  assert.equal(res.status, 200);
  assert.deepEqual(lerDados().horarios[0], {
    ...horarioLivre('h1', medicosBase[0]),
    disponivel: false,
    data: '2025-12-01',
    hora: '11:00 - 12:00',
  });
});

test('PUT /api/horarios/:id recusa disponivel que não é booleano (400)', async () => {
  gravarDados({ medicos: medicosBase, horarios: [horarioLivre('h1', medicosBase[0])] });
  const res = await request(app).put('/api/horarios/h1').send({ disponivel: 'nao' });
  assert.equal(res.status, 400);
  assert.equal(lerDados().horarios[0].disponivel, true);
});

test('PUT /api/horarios/:id não mexe em horário agendado (409)', async () => {
  gravarDados(dadosComAgendamento());
  const res = await request(app).put('/api/horarios/h1').send({ disponivel: true });
  assert.equal(res.status, 409);
  const [horario] = lerDados().horarios;
  assert.equal(horario.disponivel, false);
  assert.equal(horario.paciente_nome, 'Maria');
});

test('PUT /api/horarios/:id não deixa o médico com o mesmo horário duas vezes (409)', async () => {
  gravarDados({
    medicos: medicosBase,
    horarios: [
      horarioLivre('h1', medicosBase[0]),
      { ...horarioLivre('h2', medicosBase[0]), hora: '10:00 - 11:00' },
    ],
  });
  const res = await request(app).put('/api/horarios/h2').send({ hora: '09:00 - 10:00' });
  assert.equal(res.status, 409);
  assert.equal(lerDados().horarios[1].hora, '10:00 - 11:00');
});

test('DELETE /api/horarios/:id não remove horário agendado (409)', async () => {
  gravarDados(dadosComAgendamento());
  const res = await request(app).delete('/api/horarios/h1');
  assert.equal(res.status, 409);
  assert.equal(lerDados().horarios.length, 1);
});
