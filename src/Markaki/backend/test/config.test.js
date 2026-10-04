const { test } = require('node:test');
const assert = require('node:assert/strict');
const { lerConfig } = require('../src/config');
const { dadosDeDemonstracao, proximosDiasUteis } = require('../scripts/semear');

test('a API não sobe sem JWT_SECRET de pelo menos 32 caracteres', () => {
  assert.throws(() => lerConfig({}), /JWT_SECRET/);
  assert.throws(() => lerConfig({ JWT_SECRET: 'curto' }), /JWT_SECRET/);
  assert.equal(lerConfig({ JWT_SECRET: 'x'.repeat(32) }).jwtSegredo, 'x'.repeat(32));
});

test('padrões seguros: login limitado a 5 por minuto e bcrypt custo 10', () => {
  const config = lerConfig({ JWT_SECRET: 'x'.repeat(32) });
  assert.equal(config.limiteAuthMax, 5);
  assert.equal(config.bcryptCusto, 10);
  assert.deepEqual(config.corsOrigens, ['http://localhost:8081', 'http://localhost:19006']);
});

test('dados de demonstração: só dias úteis futuros e contas com senha em hash', async () => {
  const dias = proximosDiasUteis(5, new Date(2030, 0, 11)); // sexta-feira
  assert.deepEqual(dias, ['2030-01-14', '2030-01-15', '2030-01-16', '2030-01-17', '2030-01-18']);
  const dados = await dadosDeDemonstracao({ custo: 4, hoje: new Date(2030, 0, 11) });
  assert.deepEqual(dados.usuarios.map((u) => u.papel).sort(), ['gestor', 'paciente']);
  for (const u of dados.usuarios) assert.match(u.senha_hash, /^\$2[aby]\$/);
  assert.ok(dados.horarios.length > 0);
  assert.ok(dados.horarios.every((h) => h.data >= '2030-01-14'));
});
