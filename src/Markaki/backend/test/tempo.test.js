// O horário da agenda é o da clínica (Brasília), qualquer que seja o fuso do
// servidor: na hospedagem (Render) o processo roda em UTC.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const fusoOriginal = process.env.TZ;
before(() => {
  process.env.TZ = 'UTC';
});
after(() => {
  if (fusoOriginal === undefined) delete process.env.TZ;
  else process.env.TZ = fusoOriginal;
});

const { momentoLocal, ehFuturo } = require('../src/dominio/tempo');

test('com o servidor em UTC, 14:30 de Brasília continua 14:30', () => {
  assert.equal(new Date('2030-01-10T14:30:00-03:00').getUTCHours(), 17);
  assert.deepEqual(momentoLocal(new Date('2030-01-10T14:30:00-03:00')), {
    data: '2030-01-10',
    hora: '14:30',
    chave: '2030-01-10T14:30',
  });
});

test('22:30 de Brasília (01:30 UTC do dia seguinte) ainda é o mesmo dia na clínica', () => {
  assert.equal(momentoLocal(new Date('2030-01-10T22:30:00-03:00')).data, '2030-01-10');
});

test('horário das 16:00 ainda é futuro às 14:30 de Brasília, mesmo com o servidor em UTC', () => {
  assert.equal(ehFuturo('2030-01-10', '16:00', new Date('2030-01-10T14:30:00-03:00')), true);
  assert.equal(ehFuturo('2030-01-10', '14:00', new Date('2030-01-10T14:30:00-03:00')), false);
});

test('o fuso da clínica pode ser trocado por FUSO_HORARIO', () => {
  const { momentoNoFuso } = require('../src/dominio/tempo');
  assert.equal(momentoNoFuso(new Date('2030-01-10T14:30:00-03:00'), 'America/Manaus').hora, '13:30');
});
