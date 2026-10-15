// Roda antes do build de publicação (vercel.json): sem EXPO_PUBLIC_API_URL válida,
// para o build com uma mensagem clara em vez de publicar um app que procura a API
// em http://localhost:3000 ou num endereço que a própria CSP do site bloquearia.
// O desenvolvimento local (expo start) não passa por aqui.
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { problemaNaApiUrlDePublicacao } from '../src/servicos/http.js';

const VERCEL_JSON = fileURLToPath(new URL('../vercel.json', import.meta.url));

// Lista de origens do connect-src (ou do default-src, se não houver connect-src).
function fontesDeConexao(csp) {
  const diretivas = Object.fromEntries(
    csp
      .split(';')
      .map((d) => d.trim().split(/\s+/))
      .filter((partes) => partes[0])
      .map(([nome, ...valores]) => [nome.toLowerCase(), valores])
  );
  return diretivas['connect-src'] || diretivas['default-src'] || [];
}

// A URL da API cabe no connect-src? Segue as regras de host da CSP: esquema igual,
// host exato ou "*.dominio" (qualquer subdomínio, nunca o próprio domínio nem um
// domínio que só termine com o texto).
export function permitidoPeloConnectSrc(endereco, csp) {
  const url = new URL(endereco);
  return fontesDeConexao(csp).some((fonte) => {
    const m = /^(https?):\/\/(\*\.)?([^/:]+)(:\d+)?\/?$/i.exec(fonte);
    if (!m) return false;
    const [, esquema, curinga, host, porta] = m;
    if (`${esquema.toLowerCase()}:` !== url.protocol) return false;
    if (porta && porta.slice(1) !== url.port) return false;
    const alvo = url.hostname.toLowerCase();
    const base = host.toLowerCase();
    return curinga ? alvo.endsWith(`.${base}`) : alvo === base;
  });
}

function cspDoVercel() {
  const config = JSON.parse(fs.readFileSync(VERCEL_JSON, 'utf8'));
  for (const regra of config.headers || []) {
    const cabecalho = (regra.headers || []).find((h) => h.key.toLowerCase() === 'content-security-policy');
    if (cabecalho) return cabecalho.value;
  }
  return null;
}

function principal() {
  const valor = process.env.EXPO_PUBLIC_API_URL;
  let problema = problemaNaApiUrlDePublicacao(valor);
  const csp = problema ? null : cspDoVercel();
  if (!problema && csp && !permitidoPeloConnectSrc(valor.trim(), csp)) {
    problema =
      `EXPO_PUBLIC_API_URL (${valor.trim()}) não cabe no connect-src da Content-Security-Policy do vercel.json ` +
      `(${fontesDeConexao(csp).join(' ')}): o navegador bloquearia as chamadas à API. ` +
      'Inclua o host exato da API no connect-src do vercel.json.';
  }
  if (problema) {
    console.error(`[build] ${problema}`);
    console.error(
      '[build] Na Vercel: Settings > Environment Variables > EXPO_PUBLIC_API_URL = https://SUA-API.onrender.com/api (ver docs/deploy.md).'
    );
    process.exit(1);
  }
  console.log(`[build] API do app publicado: ${valor.trim()}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) principal();
