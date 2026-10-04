import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolverApiUrl, erroDaApi, API_URL_PADRAO } from './http.js';

test('resolverApiUrl usa o valor de EXPO_PUBLIC_API_URL sem barra no fim', () => {
  assert.equal(resolverApiUrl(' http://192.168.0.20:3000/api/ '), 'http://192.168.0.20:3000/api');
});

test('resolverApiUrl cai no endereço local quando a variável não foi definida', () => {
  assert.equal(resolverApiUrl(undefined), API_URL_PADRAO);
  assert.equal(resolverApiUrl('   '), API_URL_PADRAO);
  assert.equal(API_URL_PADRAO, 'http://localhost:3000/api');
});

test('erroDaApi guarda o status HTTP e a mensagem enviada pela API', () => {
  const erro = erroDaApi(409, { erro: 'Cancele os agendamentos primeiro.' }, 'Erro ao remover médico');
  assert.ok(erro instanceof Error);
  assert.equal(erro.status, 409);
  assert.equal(erro.message, 'Cancele os agendamentos primeiro.');
});

test('erroDaApi usa a mensagem padrão quando a resposta não tem corpo útil', () => {
  const erro = erroDaApi(500, null, 'Erro ao remover médico');
  assert.equal(erro.status, 500);
  assert.equal(erro.message, 'Erro ao remover médico');
});
