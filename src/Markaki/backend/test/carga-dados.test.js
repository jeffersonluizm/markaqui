// Resumos de carga versionados (docs/carga/dados): sem caminho da máquina de quem
// mediu, e cada rodada diz se gravou a janela da medição e a trava.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const PASTA = path.join(__dirname, '..', '..', '..', '..', 'docs', 'carga', 'dados');
// Unidade do Windows (E:/ ou E:\), pastas de usuário (macOS/Linux) e caminho de rede (\\servidor).
const CAMINHO_ABSOLUTO = /[A-Za-z]:[\\/]|\/Users\/|\/home\/|\\\\/;

test('resumos de carga versionados não guardam caminhos absolutos da máquina', () => {
  const arquivos = fs.readdirSync(PASTA).filter((f) => f.endsWith('.json'));
  assert.ok(arquivos.length >= 3);
  for (const arquivo of arquivos) {
    const texto = fs.readFileSync(path.join(PASTA, arquivo), 'utf8');
    assert.doesNotMatch(texto, CAMINHO_ABSOLUTO, arquivo);
  }
});

test('o roteiro de carga grava só o nome da trava, não o caminho', () => {
  const roteiro = fs.readFileSync(path.join(__dirname, '..', 'carga', 'executar.js'), 'utf8');
  assert.match(roteiro, /trava: trava \? path\.basename\(trava\) : null/);
});
