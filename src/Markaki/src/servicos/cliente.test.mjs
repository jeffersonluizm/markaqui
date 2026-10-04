import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarCliente, ehErroDeConexao } from './cliente.js';

function respostaJson(status, corpo) {
  return { ok: status >= 200 && status < 300, status, json: async () => corpo };
}

test('envia o token no cabeçalho Authorization e o corpo em JSON', async () => {
  let pedido;
  const cliente = criarCliente({
    baseUrl: 'http://api.teste/api',
    obterToken: () => 'abc',
    fetch: async (url, opcoes) => {
      pedido = { url, opcoes };
      return respostaJson(201, { id: 1 });
    },
  });
  const corpo = await cliente.post('/agendamentos', { horario_id: 'h1' });
  assert.deepEqual(corpo, { id: 1 });
  assert.equal(pedido.url, 'http://api.teste/api/agendamentos');
  assert.equal(pedido.opcoes.method, 'POST');
  assert.equal(pedido.opcoes.headers.Authorization, 'Bearer abc');
  assert.equal(pedido.opcoes.headers['Content-Type'], 'application/json');
  assert.equal(pedido.opcoes.body, '{"horario_id":"h1"}');
});

test('sem token não manda Authorization', async () => {
  let cabecalhos;
  const cliente = criarCliente({
    baseUrl: 'http://api.teste/api',
    obterToken: () => null,
    fetch: async (_, opcoes) => {
      cabecalhos = opcoes.headers;
      return respostaJson(200, []);
    },
  });
  await cliente.get('/medicos');
  assert.equal(cabecalhos.Authorization, undefined);
});

test('erro da API vira Error com status e a mensagem do servidor', async () => {
  const cliente = criarCliente({
    baseUrl: 'http://x/api',
    obterToken: () => 't',
    fetch: async () => respostaJson(409, { erro: 'Este horário acabou de ser reservado.' }),
  });
  await assert.rejects(cliente.post('/agendamentos', {}), (erro) => {
    assert.equal(erro.status, 409);
    assert.equal(erro.message, 'Este horário acabou de ser reservado.');
    return true;
  });
});

test('401 com token avisa que a sessão acabou (uma vez) e repassa o erro', async () => {
  const avisos = [];
  const cliente = criarCliente({
    baseUrl: 'http://x/api',
    obterToken: () => 'vencido',
    aoPerderSessao: (mensagem) => avisos.push(mensagem),
    fetch: async () => respostaJson(401, { erro: 'Sua sessão expirou. Entre novamente.' }),
  });
  await assert.rejects(cliente.get('/agendamentos'), { status: 401 });
  assert.deepEqual(avisos, ['Sua sessão expirou. Entre novamente.']);
});

test('401 sem token (login errado) não dispara o aviso de sessão', async () => {
  const avisos = [];
  const cliente = criarCliente({
    baseUrl: 'http://x/api',
    obterToken: () => null,
    aoPerderSessao: (m) => avisos.push(m),
    fetch: async () => respostaJson(401, { erro: 'E-mail ou senha inválidos.' }),
  });
  await assert.rejects(cliente.post('/auth/login', {}), { status: 401 });
  assert.deepEqual(avisos, []);
});

test('demora acima do limite vira erro de conexão (timeout)', async () => {
  const cliente = criarCliente({
    baseUrl: 'http://x/api',
    obterToken: () => null,
    timeoutMs: 20,
    fetch: (_, { signal }) =>
      new Promise((_, rejeitar) => signal.addEventListener('abort', () => rejeitar(Object.assign(new Error('abortado'), { name: 'AbortError' })))),
  });
  await assert.rejects(cliente.get('/saude'), (erro) => {
    assert.ok(ehErroDeConexao(erro));
    assert.match(erro.message, /demorou/i);
    return true;
  });
});

test('falha de rede vira erro de conexão com mensagem clara', async () => {
  const cliente = criarCliente({
    baseUrl: 'http://x/api',
    obterToken: () => null,
    fetch: async () => {
      throw new TypeError('Network request failed');
    },
  });
  await assert.rejects(cliente.get('/saude'), (erro) => {
    assert.ok(ehErroDeConexao(erro));
    assert.match(erro.message, /servidor/i);
    return true;
  });
});
