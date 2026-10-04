import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarControleUltimaRequisicao } from './requisicoes.js';

test('só a última requisição pedida é a atual', () => {
  const controle = criarControleUltimaRequisicao();
  const primeira = controle.nova();
  const segunda = controle.nova();
  assert.equal(controle.ehAtual(primeira), false);
  assert.equal(controle.ehAtual(segunda), true);
});

test('voltar ao mesmo médico não reaproveita a resposta antiga', () => {
  // Médico A, depois B, depois A de novo: a primeira resposta de A chega por último.
  const controle = criarControleUltimaRequisicao();
  const aAntiga = controle.nova();
  controle.nova();
  const aNova = controle.nova();
  assert.equal(controle.ehAtual(aAntiga), false);
  assert.equal(controle.ehAtual(aNova), true);
});

test('invalidar descarta a requisição em andamento', () => {
  const controle = criarControleUltimaRequisicao();
  const pedida = controle.nova();
  controle.invalidar();
  assert.equal(controle.ehAtual(pedida), false);
});
