// Trava de carga compartilhada entre os projetos da máquina (.carga-lock): grava o
// dono, mostra quem está segurando, nunca apaga a trava de outro e se solta em
// Ctrl+C (SIGINT) e SIGTERM.
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { EventEmitter } = require('events');
const { tomarTrava, lerDono, liberarAoEncerrar } = require('../carga/trava');

const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'markaqui-trava-'));
after(() => fs.rmSync(raiz, { recursive: true, force: true }));
let n = 0;
const novaTrava = () => path.join(raiz, `.carga-lock-${(n += 1)}`);
const AGORA = new Date('2026-10-14T23:55:51.000Z');

test('tomar a trava grava o dono (projeto, pid e início) dentro da pasta', () => {
  const caminho = novaTrava();
  const trava = tomarTrava(caminho, { projeto: 'markaqui', pid: 4242, agora: AGORA });
  assert.deepEqual(lerDono(caminho), { projeto: 'markaqui', pid: 4242, inicio: AGORA.toISOString() });
  trava.liberar();
  assert.equal(fs.existsSync(caminho), false);
});

test('trava ocupada: diz quem é o dono e não apaga nada', () => {
  const caminho = novaTrava();
  tomarTrava(caminho, { projeto: 'cineclube', pid: 999999, agora: AGORA });
  assert.throws(
    () => tomarTrava(caminho, { projeto: 'markaqui', pid: 4242 }),
    (erro) =>
      erro.code === 'TRAVA_OCUPADA' &&
      /cineclube/.test(erro.message) &&
      /999999/.test(erro.message) &&
      erro.message.includes(AGORA.toISOString())
  );
  assert.equal(lerDono(caminho).projeto, 'cineclube');
});

test('trava ocupada sem arquivo de dono (versão antiga do roteiro): avisa que o dono é desconhecido', () => {
  const caminho = novaTrava();
  fs.mkdirSync(caminho);
  assert.throws(() => tomarTrava(caminho, { projeto: 'markaqui', pid: 1 }), /dono desconhecido/);
  assert.equal(fs.existsSync(caminho), true);
});

test('liberar só apaga a própria trava (outro processo pode ter assumido depois)', () => {
  const caminho = novaTrava();
  const minha = tomarTrava(caminho, { projeto: 'markaqui', pid: 4242 });
  fs.writeFileSync(path.join(caminho, 'dono.json'), JSON.stringify({ projeto: 'gestaopro', pid: 7, inicio: 'x' }));
  minha.liberar();
  assert.equal(fs.existsSync(caminho), true);
});

for (const [sinal, codigo] of [
  ['SIGINT', 130],
  ['SIGTERM', 143],
]) {
  test(`${sinal} solta a trava e encerra com ${codigo} (o finally não roda num encerramento forçado)`, () => {
    const caminho = novaTrava();
    const trava = tomarTrava(caminho, { projeto: 'markaqui', pid: process.pid });
    const processo = new EventEmitter();
    const saidas = [];
    liberarAoEncerrar(trava, { processo, sair: (c) => saidas.push(c) });
    processo.emit(sinal);
    assert.equal(fs.existsSync(caminho), false);
    assert.deepEqual(saidas, [codigo]);
  });
}

test('saída do processo por qualquer caminho (evento exit) também solta a trava', () => {
  const caminho = novaTrava();
  const trava = tomarTrava(caminho, { projeto: 'markaqui', pid: process.pid });
  const processo = new EventEmitter();
  liberarAoEncerrar(trava, { processo, sair: () => {} });
  processo.emit('exit', 1);
  assert.equal(fs.existsSync(caminho), false);
});
