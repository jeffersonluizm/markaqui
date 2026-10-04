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

const { app } = require('./server');

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
