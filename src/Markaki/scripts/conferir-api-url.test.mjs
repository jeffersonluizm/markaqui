// O build da Vercel roda este script antes do expo export: sem EXPO_PUBLIC_API_URL
// (ou apontando para localhost), o build falha com uma mensagem clara em vez de
// publicar um app que procura a API em http://localhost:3000.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./conferir-api-url.mjs', import.meta.url));
const rodar = (valor) => {
  const env = { ...process.env };
  delete env.EXPO_PUBLIC_API_URL;
  if (valor !== undefined) env.EXPO_PUBLIC_API_URL = valor;
  return spawnSync(process.execPath, [script], { env, encoding: 'utf8' });
};

test('sem EXPO_PUBLIC_API_URL o build de publicação falha com mensagem clara', () => {
  const r = rodar(undefined);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /EXPO_PUBLIC_API_URL/);
  assert.match(r.stderr, /deploy\.md/);
});

test('com localhost o build de publicação falha', () => {
  assert.equal(rodar('http://localhost:3000/api').status, 1);
});

test('com a URL https da API o build segue', () => {
  const r = rodar('https://markaqui-api.onrender.com/api');
  assert.equal(r.status, 0, r.stderr);
});
