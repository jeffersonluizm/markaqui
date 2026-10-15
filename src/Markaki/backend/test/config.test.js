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
  assert.equal(config.limiteConsultasAtivas, 3);
  assert.deepEqual(config.corsOrigens, ['http://localhost:8081', 'http://localhost:19006']);
});

test('dados de demonstração: médicos e horários só em dias úteis futuros, sem contas', async () => {
  const dias = proximosDiasUteis(5, new Date('2030-01-11T12:00:00-03:00')); // sexta-feira
  assert.deepEqual(dias, ['2030-01-14', '2030-01-15', '2030-01-16', '2030-01-17', '2030-01-18']);
  const dados = dadosDeDemonstracao({ hoje: new Date('2030-01-11T12:00:00-03:00') });
  assert.equal(dados.usuarios, undefined);
  assert.ok(dados.medicos.length > 0);
  assert.ok(dados.horarios.length > 0);
  assert.ok(dados.horarios.every((h) => h.data >= '2030-01-14'));
});

test('a API escuta só na própria máquina, a menos que HOST diga outra coisa', () => {
  assert.equal(lerConfig({ JWT_SECRET: 'x'.repeat(32) }).host, '127.0.0.1');
  assert.equal(lerConfig({ JWT_SECRET: 'x'.repeat(32), HOST: '0.0.0.0' }).host, '0.0.0.0');
});
