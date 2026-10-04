// Gera os ícones do app (assets/*.png) a partir da mesma geometria do componente
// Logo (src/componentes/Logo.js): calendário branco com um "check" azul-gelo sobre
// o quadrado marinho. Sem dependências: rasteriza com supersampling e grava PNG
// com o zlib do Node. Uso: node scripts/gerar-icones.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const MARINHO = [0x1e, 0x3a, 0x56, 255];
const BRANCO = [255, 255, 255, 255];
const GELO = [0xd8, 0xec, 0xf5, 255];

// Geometria num quadro de 1024 x 1024 (a mesma do Logo.js).
function dentroRetanguloArredondado(x, y, [x0, y0, x1, y1], r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function distanciaAoSegmento(x, y, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
}

const CHECK = [
  [372, 610],
  [478, 708],
  [668, 500],
];

// Camadas de baixo para cima: [forma(x, y) => boolean, cor].
function camadas({ fundo }) {
  const lista = [];
  if (fundo) lista.push([(x, y) => dentroRetanguloArredondado(x, y, [0, 0, 1024, 1024], 224), MARINHO]);
  lista.push([
    (x, y) =>
      dentroRetanguloArredondado(x, y, [232, 288, 792, 808], 80) &&
      !dentroRetanguloArredondado(x, y, [288, 344, 736, 752], 32),
    BRANCO,
  ]);
  lista.push([
    (x, y) =>
      dentroRetanguloArredondado(x, y, [232, 288, 792, 420], 80) || (y >= 380 && y <= 420 && x >= 232 && x <= 792),
    BRANCO,
  ]);
  lista.push([(x, y) => dentroRetanguloArredondado(x, y, [352, 220, 416, 340], 32), GELO]);
  lista.push([(x, y) => dentroRetanguloArredondado(x, y, [608, 220, 672, 340], 32), GELO]);
  lista.push([
    (x, y) =>
      distanciaAoSegmento(x, y, CHECK[0], CHECK[1]) <= 34 || distanciaAoSegmento(x, y, CHECK[1], CHECK[2]) <= 34,
    GELO,
  ]);
  return lista;
}

// Rasteriza em `lado` pixels; `escala` < 1 encolhe o desenho (zona segura do ícone adaptativo).
function rasterizar(lado, { fundo = true, escala = 1, corDeFundo = null } = {}) {
  const formas = camadas({ fundo });
  const pixels = Buffer.alloc(lado * lado * 4);
  const AMOSTRAS = 4;
  for (let py = 0; py < lado; py++) {
    for (let px = 0; px < lado; px++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (let sy = 0; sy < AMOSTRAS; sy++) {
        for (let sx = 0; sx < AMOSTRAS; sx++) {
          const u = ((px + (sx + 0.5) / AMOSTRAS) / lado - 0.5) / escala + 0.5;
          const v = ((py + (sy + 0.5) / AMOSTRAS) / lado - 0.5) / escala + 0.5;
          let cor = corDeFundo;
          for (const [dentro, c] of formas) if (dentro(u * 1024, v * 1024)) cor = c;
          if (cor) {
            r += cor[0];
            g += cor[1];
            b += cor[2];
            a += cor[3];
          }
        }
      }
      const n = AMOSTRAS * AMOSTRAS;
      const i = (py * lado + px) * 4;
      // Cor média ponderada pela cobertura (evita borda escura no antialias).
      pixels[i] = a ? Math.round((r / a) * 255) : 0;
      pixels[i + 1] = a ? Math.round((g / a) * 255) : 0;
      pixels[i + 2] = a ? Math.round((b / a) * 255) : 0;
      pixels[i + 3] = Math.round(a / n);
    }
  }
  return pixels;
}

const TABELA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = TABELA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function bloco(tipo, dados) {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, crc]);
}
function png(lado, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lado, 0);
  ihdr.writeUInt32BE(lado, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 6; // RGBA
  const linhas = Buffer.alloc(lado * (lado * 4 + 1));
  for (let y = 0; y < lado; y++) pixels.copy(linhas, y * (lado * 4 + 1) + 1, y * lado * 4, (y + 1) * lado * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', ihdr),
    bloco('IDAT', zlib.deflateSync(linhas, { level: 9 })),
    bloco('IEND', Buffer.alloc(0)),
  ]);
}

// Imagem de compartilhamento (Open Graph, 1200 x 630): fundo azul-gelo com o logo.
function imagemCompartilhamento(largura, altura, ladoLogo) {
  const logo = rasterizar(ladoLogo);
  const pixels = Buffer.alloc(largura * altura * 4);
  for (let i = 0; i < largura * altura; i++) pixels.set(GELO, i * 4);
  const x0 = Math.round((largura - ladoLogo) / 2);
  const y0 = Math.round((altura - ladoLogo) / 2);
  for (let y = 0; y < ladoLogo; y++) {
    for (let x = 0; x < ladoLogo; x++) {
      const o = (y * ladoLogo + x) * 4;
      const a = logo[o + 3] / 255;
      const d = ((y0 + y) * largura + (x0 + x)) * 4;
      for (let c = 0; c < 3; c++) pixels[d + c] = Math.round(logo[o + c] * a + pixels[d + c] * (1 - a));
    }
  }
  return pixels;
}

// PNG retangular (o png() abaixo é quadrado).
function pngRetangular(largura, altura, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const linhas = Buffer.alloc(altura * (largura * 4 + 1));
  for (let y = 0; y < altura; y++)
    pixels.copy(linhas, y * (largura * 4 + 1) + 1, y * largura * 4, (y + 1) * largura * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', ihdr),
    bloco('IDAT', zlib.deflateSync(linhas, { level: 9 })),
    bloco('IEND', Buffer.alloc(0)),
  ]);
}

const pasta = path.join(__dirname, '..', 'assets');
fs.mkdirSync(pasta, { recursive: true });
const saidas = {
  'icon.png': [1024, {}],
  'splash-icon.png': [512, {}],
  // Ícone adaptativo do Android: só o desenho, encolhido para a zona segura; o
  // fundo marinho vem do app.json.
  'adaptive-icon.png': [1024, { fundo: false, escala: 0.62 }],
  'favicon.png': [48, {}],
};
for (const [nome, [lado, opcoes]] of Object.entries(saidas)) {
  fs.writeFileSync(path.join(pasta, nome), png(lado, rasterizar(lado, opcoes)));
  console.log(`assets/${nome} (${lado}x${lado})`);
}

// Imagem de compartilhamento do link (LinkedIn, WhatsApp), servida pelo app web.
const pastaPublica = path.join(__dirname, '..', 'public');
fs.mkdirSync(pastaPublica, { recursive: true });
fs.writeFileSync(
  path.join(pastaPublica, 'og-image.png'),
  pngRetangular(1200, 630, imagemCompartilhamento(1200, 630, 360))
);
console.log('public/og-image.png (1200x630)');
