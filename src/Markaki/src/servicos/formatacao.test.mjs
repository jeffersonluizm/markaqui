import { test } from 'node:test';
import assert from 'node:assert/strict';
import { iniciais, dataCurta, dataPorExtenso, diaDaSemana, telefoneFormatado, saudacao } from './formatacao.js';

test('iniciais usa a primeira e a última palavra e ignora títulos', () => {
  assert.equal(iniciais('Dra. Helena Duarte'), 'HD');
  assert.equal(iniciais('Dr. André de Lacerda'), 'AL');
  assert.equal(iniciais('Marina'), 'M');
  assert.equal(iniciais(''), '?');
});

test('datas da agenda em português', () => {
  assert.equal(dataCurta('2030-02-01'), '01/02/2030');
  assert.equal(diaDaSemana('2030-02-01'), 'sexta-feira');
  assert.equal(dataPorExtenso('2030-02-01'), 'sexta-feira, 1 de fevereiro');
});

test('telefone com DDD', () => {
  assert.equal(telefoneFormatado('31988887777'), '(31) 98888-7777');
  assert.equal(telefoneFormatado('3133334444'), '(31) 3333-4444');
  assert.equal(telefoneFormatado(''), '');
});

test('saudação conforme a hora', () => {
  assert.equal(saudacao(new Date(2030, 0, 1, 8)), 'Bom dia');
  assert.equal(saudacao(new Date(2030, 0, 1, 13)), 'Boa tarde');
  assert.equal(saudacao(new Date(2030, 0, 1, 20)), 'Boa noite');
});
