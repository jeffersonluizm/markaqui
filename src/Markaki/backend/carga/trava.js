// Trava de carga compartilhada entre os projetos da máquina (uma carga por vez).
// É uma pasta (mkdir é atômico) com um dono.json dentro: projeto, pid e início.
// - Ocupada: mostra quem é o dono e se o processo dele ainda existe; nunca apaga a
//   trava de outro (quem decide se ela está órfã é uma pessoa).
// - Solta no fim normal (finally), em Ctrl+C (SIGINT), SIGTERM e na saída do
//   processo. Um encerramento que não pode ser capturado (kill -9, "Finalizar
//   tarefa") ainda deixa a pasta, mas o dono.json diz de quem ela é.
const fs = require('fs');
const path = require('path');

const ARQUIVO_DONO = 'dono.json';

function lerDono(caminho) {
  try {
    return JSON.parse(fs.readFileSync(path.join(caminho, ARQUIVO_DONO), 'utf8'));
  } catch {
    return null;
  }
}

function processoExiste(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (erro) {
    return erro.code === 'EPERM';
  }
}

function descreverDono(caminho) {
  const dono = lerDono(caminho);
  if (!dono) return 'dono desconhecido (trava sem dono.json, de uma versão antiga do roteiro)';
  const situacao = processoExiste(dono.pid)
    ? 'o processo ainda está rodando'
    : 'o processo não existe mais: a trava parece órfã';
  return `${dono.projeto}, pid ${dono.pid}, desde ${dono.inicio} (${situacao})`;
}

function tomarTrava(caminho, { projeto, pid = process.pid, agora = new Date() }) {
  try {
    fs.mkdirSync(caminho);
  } catch (erro) {
    if (erro.code !== 'EEXIST') throw erro;
    const ocupada = new Error(
      `Outra carga está rodando (${caminho}): ${descreverDono(caminho)}. ` +
        'Esta trava não é removida automaticamente; se tiver certeza de que está órfã, apague a pasta.'
    );
    ocupada.code = 'TRAVA_OCUPADA';
    throw ocupada;
  }
  const dono = { projeto, pid, inicio: agora.toISOString() };
  fs.writeFileSync(path.join(caminho, ARQUIVO_DONO), `${JSON.stringify(dono, null, 2)}\n`);

  let liberada = false;
  return {
    caminho,
    dono,
    // Idempotente; só apaga se a trava ainda for deste dono.
    liberar() {
      if (liberada) return;
      liberada = true;
      const atual = lerDono(caminho);
      if (atual && atual.pid === dono.pid && atual.inicio === dono.inicio) {
        fs.rmSync(caminho, { recursive: true, force: true });
      }
    },
  };
}

// Solta a trava em SIGINT (130), SIGTERM (143) e na saída do processo.
function liberarAoEncerrar(trava, { processo = process, sair = (codigo) => process.exit(codigo) } = {}) {
  const porSinal = (sinal, codigo) => () => {
    console.error(`\n[carga] ${sinal} recebido: liberando a trava ${trava.caminho}.`);
    trava.liberar();
    sair(codigo);
  };
  processo.once('SIGINT', porSinal('SIGINT', 130));
  processo.once('SIGTERM', porSinal('SIGTERM', 143));
  processo.once('exit', () => trava.liberar());
}

module.exports = { tomarTrava, lerDono, liberarAoEncerrar };
