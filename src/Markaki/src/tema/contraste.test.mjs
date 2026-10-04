// Confere o contraste (WCAG 2.1) dos pares de cor usados nas telas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cores } from './tokens.js';

function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const PARES = [
  ['texto do botão primário', '#ffffff', cores.marinho],
  ['título sobre o azul-gelo', cores.marinhoEscuro, cores.gelo],
  ['texto sobre o fundo', cores.texto, cores.fundo],
  ['texto secundário sobre branco', cores.textoSecundario, cores.superficie],
  ['texto secundário sobre o fundo', cores.textoSecundario, cores.fundo],
  ['texto suave sobre branco', cores.textoSuave, cores.superficie],
  ['erro sobre branco', cores.erro, cores.superficie],
  ['erro sobre fundo de erro', cores.erro, cores.erroFundo],
  ['sucesso sobre fundo de sucesso', cores.sucesso, cores.sucessoFundo],
  ['aviso sobre fundo de aviso', cores.aviso, cores.avisoFundo],
  ['marinho sobre selecionado', cores.marinho, cores.selecionado],
  ['marinho sobre azul-gelo', cores.marinho, cores.gelo],
];

for (const [nome, frente, fundo] of PARES) {
  test(`contraste AA (>= 4,5:1): ${nome}`, () => {
    const valor = contraste(frente, fundo);
    assert.ok(valor >= 4.5, `${nome}: ${valor.toFixed(2)}:1`);
  });
}
