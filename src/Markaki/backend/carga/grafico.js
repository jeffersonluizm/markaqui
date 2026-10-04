// Gera o gráfico (SVG) do comparativo JSON x SQLite a partir dos resumos da carga.
// Uso: node carga/grafico.js <antes.json> <depois.json> <saida.svg>
// Três painéis com a mesma régua em cada um (sem eixo duplo): leitura por tamanho
// da base, escrita por conexões e latência p97,5 do misto em degraus.
const fs = require('fs');

const [arqAntes, arqDepois, saida] = process.argv.slice(2);
const antes = JSON.parse(fs.readFileSync(arqAntes, 'utf8')).linhas;
const depois = JSON.parse(fs.readFileSync(arqDepois, 'utf8')).linhas;

// Paleta categórica validada (slots 1 e 2; ver skill de dataviz), clara e escura.
const SERIES = [
  { chave: 'depois', nome: 'SQLite (depois)', classe: 's1' },
  { chave: 'antes', nome: 'Arquivo JSON (antes)', classe: 's2' },
];

const achar = (linhas, cenario, variante) => linhas.find((l) => l.cenario === cenario && l.variante === variante);
const fmt = (n) => {
  if (n === undefined || n === null) return 's/d';
  if (n < 1000) return String(Math.round(n));
  const mil = n / 1000;
  return `${Number.isInteger(mil) || mil >= 10 ? Math.round(mil) : mil.toFixed(1).replace('.', ',')} mil`;
};

function painel({ titulo, unidade, categorias, valor, x0, y0, largura, altura }) {
  const dados = categorias.map((c) => ({
    rotulo: c.rotulo,
    valores: SERIES.map((s) => ({ ...s, v: valor(s.chave === 'antes' ? antes : depois, c) })),
  }));
  const max = Math.max(...dados.flatMap((d) => d.valores.map((v) => v.v || 0)), 1);
  // Passo "redondo" (1, 2, 2,5, 3, 4, 5, 6 ou 8 x 10^k) com 4 divisões.
  const bruto = max / 4;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * potencia).find((p) => p >= bruto);
  const topo = passo * 4;
  const areaY = y0 + 52;
  const areaAltura = altura - 52 - 40;
  const escala = (v) => areaAltura * (v / topo);
  const larguraGrupo = largura / categorias.length;
  const larguraBarra = Math.min(34, (larguraGrupo - 24) / 2);
  let svg = `<text class="titulo" x="${x0}" y="${y0 + 16}">${titulo}</text>`;
  svg += `<text class="sub" x="${x0}" y="${y0 + 34}">${unidade}</text>`;
  for (let i = 0; i <= 4; i++) {
    const v = (topo / 4) * i;
    const y = areaY + areaAltura - escala(v);
    svg += `<line class="grade" x1="${x0}" x2="${x0 + largura}" y1="${y}" y2="${y}"/>`;
    svg += `<text class="eixo" x="${x0 - 6}" y="${y + 4}" text-anchor="end">${fmt(v)}</text>`;
  }
  dados.forEach((d, i) => {
    const cx = x0 + larguraGrupo * i + larguraGrupo / 2;
    d.valores.forEach((s, j) => {
      const h = Math.max(escala(s.v || 0), 1);
      const x = cx - larguraBarra - 1 + j * (larguraBarra + 2);
      const y = areaY + areaAltura - h;
      // Barra com ponta arredondada (4 px) e base reta no eixo.
      const r = Math.min(4, h, larguraBarra / 2);
      svg += `<path class="${s.classe}" d="M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + larguraBarra - r} Q${x + larguraBarra},${y} ${x + larguraBarra},${y + r} V${y + h} Z"><title>${s.nome}, ${d.rotulo}: ${fmt(s.v)} ${unidade}</title></path>`;
      svg += `<text class="valor" x="${x + larguraBarra / 2}" y="${y - 5}" text-anchor="middle">${fmt(s.v)}</text>`;
    });
    svg += `<text class="eixo" x="${cx}" y="${areaY + areaAltura + 18}" text-anchor="middle">${d.rotulo}</text>`;
  });
  svg += `<line class="base" x1="${x0}" x2="${x0 + largura}" y1="${areaY + areaAltura}" y2="${areaY + areaAltura}"/>`;
  return svg;
}

const LARGURA = 1040;
const ALTURA = 430;
const largPainel = 270;
const paineis = [
  painel({
    titulo: 'Leitura: agenda de um médico',
    unidade: 'requisições/s (S1 e S1b, 50 conexões)',
    categorias: [100, 1000, 10000].map((n) => ({ rotulo: `${n.toLocaleString('pt-BR')} horários`, n })),
    valor: (l, c) => (achar(l, c.n === 100 ? 'S1' : 'S1b', `${c.n} horários, 50 conexões`) || {}).rps,
    x0: 60, y0: 70, largura: largPainel, altura: ALTURA - 80,
  }),
  painel({
    titulo: 'Escrita com 10.000 horários',
    unidade: 'escritas/s (S3) por conexões simultâneas',
    categorias: [1, 10, 50, 100].map((c) => ({ rotulo: `${c} con.`, c })),
    valor: (l, c) => (achar(l, 'S3', `10000 horários, ${c.c} conexões`) || {}).rps,
    x0: 60 + largPainel + 60, y0: 70, largura: largPainel, altura: ALTURA - 80,
  }),
  painel({
    titulo: 'Misto 90/10: latência p97,5',
    unidade: 'ms por conexões (S4, 10.000 horários; menor é melhor)',
    categorias: [10, 50, 100, 200, 300].map((c) => ({ rotulo: `${c}`, c })),
    valor: (l, c) => (achar(l, 'S4', `10.000 horários, ${c.c} conexões`) || {}).p975,
    x0: 60 + 2 * (largPainel + 60), y0: 70, largura: largPainel, altura: ALTURA - 80,
  }),
];

const legenda = SERIES.map(
  (s, i) => `<rect class="${s.classe}" x="${60 + i * 190}" y="22" width="14" height="14" rx="3"/><text class="legenda" x="${80 + i * 190}" y="34">${s.nome}</text>`
).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LARGURA} ${ALTURA}" width="${LARGURA}" height="${ALTURA}" role="img" aria-labelledby="t d" font-family="Inter, Segoe UI, Arial, sans-serif">
<title id="t">API do Markaqui: arquivo JSON (antes) e SQLite (depois)</title>
<desc id="d">Três painéis: requisições de leitura por segundo por tamanho da base, escritas por segundo por conexões e latência p97,5 do teste misto. Os números estão na tabela de docs/carga/2026-10-04-resultados.md.</desc>
<style>
  .fundo { fill: #fcfcfb } .titulo { fill: #0b0b0b; font-size: 15px; font-weight: 600 }
  .sub, .eixo { fill: #52514e; font-size: 11px } .legenda { fill: #0b0b0b; font-size: 13px }
  .valor { fill: #0b0b0b; font-size: 10.5px; font-weight: 600 } .grade { stroke: #e6e5e1; stroke-width: 1 }
  .base { stroke: #8f8e88; stroke-width: 1 } .s1 { fill: #2a78d6 } .s2 { fill: #eb6834 }
  @media (prefers-color-scheme: dark) {
    .fundo { fill: #1a1a19 } .titulo, .legenda, .valor { fill: #ffffff } .sub, .eixo { fill: #c3c2b7 }
    .grade { stroke: #33332f } .base { stroke: #77766f } .s1 { fill: #3987e5 } .s2 { fill: #d95926 }
  }
</style>
<rect class="fundo" width="${LARGURA}" height="${ALTURA}" rx="12"/>
${legenda}
${paineis.join('\n')}
</svg>
`;
fs.writeFileSync(saida, svg);
console.log(`Gráfico gravado em ${saida}`);
