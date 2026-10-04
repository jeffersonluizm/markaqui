import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aguardarServidor } from './acordar.js';

const semEspera = () => Promise.resolve();

test('servidor acordado na primeira tentativa: não avisa nada', async () => {
  const avisos = [];
  await aguardarServidor({
    verificar: async () => ({ status: 'ok' }),
    aoDemorar: () => avisos.push(1),
    esperar: semEspera,
  });
  assert.deepEqual(avisos, []);
});

test('servidor dormindo (hospedagem gratuita): avisa uma vez e tenta até acordar', async () => {
  let tentativas = 0;
  const avisos = [];
  await aguardarServidor({
    verificar: async () => {
      tentativas += 1;
      if (tentativas < 4) throw Object.assign(new Error('demorou'), { conexao: true });
      return { status: 'ok' };
    },
    aoDemorar: () => avisos.push('acordando'),
    esperar: semEspera,
  });
  assert.equal(tentativas, 4);
  assert.deepEqual(avisos, ['acordando']);
});

test('desiste depois do limite de tentativas e devolve o último erro', async () => {
  let tentativas = 0;
  await assert.rejects(
    aguardarServidor({
      verificar: async () => {
        tentativas += 1;
        throw Object.assign(new Error('sem rede'), { conexao: true });
      },
      esperar: semEspera,
      tentativas: 5,
    }),
    /sem rede/
  );
  assert.equal(tentativas, 5);
});

test('erro que não é de conexão (ex.: 500) não fica tentando', async () => {
  let tentativas = 0;
  await assert.rejects(
    aguardarServidor({
      verificar: async () => {
        tentativas += 1;
        throw Object.assign(new Error('falha'), { status: 500 });
      },
      esperar: semEspera,
    }),
    /falha/
  );
  assert.equal(tentativas, 1);
});
