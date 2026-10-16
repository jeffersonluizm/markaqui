import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entrarNaDemonstracao } from './demonstracao.js';

const erro = (status) => Object.assign(new Error(`erro ${status}`), { status });

test('entra de primeira: não recarrega a lista de contas', async () => {
  const chamadas = [];
  const sessao = await entrarNaDemonstracao('paciente', {
    entrar: async (papel) => {
      chamadas.push(papel);
      return { token: 't', usuario: { papel } };
    },
    recarregar: async () => assert.fail('não devia recarregar'),
  });
  assert.equal(sessao.token, 't');
  assert.deepEqual(chamadas, ['paciente']);
});

test('401 (demonstração recriada no meio do caminho): recarrega /api/demo e tenta mais uma vez', async () => {
  let tentativas = 0;
  let recargas = 0;
  const sessao = await entrarNaDemonstracao('gestor', {
    entrar: async () => {
      tentativas += 1;
      if (tentativas === 1) throw erro(401);
      return { token: 'novo' };
    },
    recarregar: async () => {
      recargas += 1;
      return [{ papel: 'gestor', nome: 'Clínica' }];
    },
  });
  assert.equal(sessao.token, 'novo');
  assert.equal(tentativas, 2);
  assert.equal(recargas, 1);
});

test('401 de novo na segunda tentativa: desiste e devolve o erro (sem laço)', async () => {
  let tentativas = 0;
  await assert.rejects(
    entrarNaDemonstracao('gestor', {
      entrar: async () => {
        tentativas += 1;
        throw erro(401);
      },
      recarregar: async () => [{ papel: 'gestor' }],
    }),
    /erro 401/
  );
  assert.equal(tentativas, 2);
});

test('a demonstração foi desligada (papel sumiu da lista): não tenta de novo', async () => {
  let tentativas = 0;
  await assert.rejects(
    entrarNaDemonstracao('paciente', {
      entrar: async () => {
        tentativas += 1;
        throw erro(401);
      },
      recarregar: async () => [],
    }),
    /erro 401/
  );
  assert.equal(tentativas, 1);
});

test('outros erros (429, conexão) não disparam nova tentativa', async () => {
  let tentativas = 0;
  await assert.rejects(
    entrarNaDemonstracao('paciente', {
      entrar: async () => {
        tentativas += 1;
        throw erro(429);
      },
      recarregar: async () => assert.fail('não devia recarregar'),
    }),
    /erro 429/
  );
  assert.equal(tentativas, 1);
});

test('demonstração cheia (503): mensagem amigável, sem nova tentativa', async () => {
  let tentativas = 0;
  await assert.rejects(
    entrarNaDemonstracao('paciente', {
      entrar: async () => {
        tentativas += 1;
        throw Object.assign(new Error('Service Unavailable'), { status: 503 });
      },
      recarregar: async () => assert.fail('não devia recarregar'),
    }),
    (e) => e.status === 503 && /cheia/.test(e.message) && /alguns minutos/.test(e.message)
  );
  assert.equal(tentativas, 1);
});
