// Percorre o fluxo do avaliador no Chrome instalado (headless) e tira os prints do
// README: boas-vindas, "Entrar como paciente", agendar, consultas, histórico, perfil;
// depois "Entrar como clínica", painel, agenda e consultas. Falha se algum passo não
// funcionar, então também serve de teste de fumaça das telas.
//
// Pré-requisitos: app web e API rodando com DEMO_ENABLED=true (o iniciar.bat faz isso)
// e as bibliotecas instaladas fora do projeto: npm i --no-save playwright-core pngjs gifenc
// Uso: node ferramentas/capturar-telas.js [url-do-app] [pasta-destino]
// Ex.: node ferramentas/capturar-telas.js http://localhost:8081 docs/img/app
// GIF do README em vez dos prints: GIF=docs/img/demo.gif node ferramentas/capturar-telas.js
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const [base = 'http://localhost:8081', destino = 'docs/img/app'] = process.argv.slice(2);
const ARQUIVO_GIF = process.env.GIF;

const ROTEIRO = [
  ['abrir', '/'],
  ['esperar', 'Explore a demonstração'],
  ['foto', '01-boas-vindas'],
  ['clicar', 'Entrar como paciente'],
  ['esperar', 'Sua próxima consulta'],
  ['foto', '06-inicio-paciente'],
  ['clicar', 'Agendar consulta'],
  ['clicar', 'Dr. Rafael Moura, Ortopedia'],
  ['esperar', '1. Escolha o dia'],
  ['clicar', '15:00'],
  ['foto', '08-agenda-do-medico'],
  ['clicar', 'Continuar com 15:00'],
  ['esperar', 'Confirme sua consulta'],
  ['foto', '09-confirmar'],
  ['clicar', 'Confirmar agendamento'],
  ['esperar', 'Consulta agendada!'],
  ['foto', '10-agendado'],
  ['clicar', 'Ver minhas consultas'],
  ['esperar', 'Histórico'],
  ['foto', '11-consultas'],
  ['clicar', 'Histórico'],
  ['foto', '12-historico'],
  ['clicar', 'Perfil'],
  ['esperar', 'Conta de demonstração'],
  ['foto', '14-perfil'],
  ['clicar', 'Sair'],
  ['esperar', 'Sair da conta?'],
  ['clicar', 'Sair'],
  ['esperar', 'Explore a demonstração'],
  ['clicar', 'Entrar como clínica'],
  ['esperar', 'consultas hoje'],
  ['foto', '20-painel-clinica'],
  ['clicar', 'Agenda'],
  ['esperar', 'Abrir horários'],
  ['foto', '21-agenda-clinica'],
  ['clicar', 'Consultas'],
  ['esperar', 'Histórico'],
  ['foto', '25-consultas-clinica'],
];

(async () => {
  fs.mkdirSync(destino, { recursive: true });
  const navegador = await chromium.launch({ executablePath: CHROME });
  const contexto = await navegador.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: ARQUIVO_GIF ? 1 : 2,
    reducedMotion: 'reduce',
  });
  let gif = null;
  if (ARQUIVO_GIF) {
    const { GIFEncoder } = require('gifenc');
    gif = GIFEncoder();
  }
  // No modo GIF cada passo vira um quadro (as telas principais ficam mais tempo).
  async function quadro(ms) {
    const { PNG } = require('pngjs');
    const { quantize, applyPalette } = require('gifenc');
    const png = PNG.sync.read(await pagina.screenshot());
    const paleta = quantize(png.data, 128);
    gif.writeFrame(applyPalette(png.data, paleta), png.width, png.height, { palette: paleta, delay: ms });
  }
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(e.message));
  try {
    for (const [acao, alvo] of ROTEIRO) {
      if (acao === 'abrir') await pagina.goto(base + alvo);
      if (acao === 'esperar') await pagina.getByText(alvo, { exact: false }).first().waitFor({ timeout: 90000 });
      if (acao === 'clicar') {
        // Com dois botões de mesmo nome (ex.: "Sair" na tela e no diálogo), vale o último:
        // o diálogo é desenhado depois, no fim da página.
        await pagina
          .getByRole('button', { name: alvo, exact: true })
          .or(pagina.getByRole('tab', { name: alvo }))
          .last()
          .click();
        await pagina.waitForTimeout(400);
        if (gif) await quadro(500);
      }
      if (acao === 'foto') {
        await pagina.waitForTimeout(1200);
        if (gif) {
          await quadro(1600);
        } else {
          await pagina.screenshot({ path: path.join(destino, `${alvo}.png`) });
          console.log(`print ${alvo}.png`);
        }
      }
    }
    if (gif) {
      gif.finish();
      fs.writeFileSync(ARQUIVO_GIF, gif.bytes());
      console.log(`GIF gravado em ${ARQUIVO_GIF}`);
    }
  } finally {
    await navegador.close();
  }
  if (erros.length) {
    console.error('Erros na página:\n' + erros.join('\n'));
    process.exitCode = 1;
  }
})().catch((erro) => {
  console.error(`Falhou: ${erro.message}`);
  process.exitCode = 1;
});
