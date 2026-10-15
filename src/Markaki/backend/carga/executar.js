// Teste de carga da API (cenários S1 a S7 de docs/carga). Cada cenário sobe a API
// num processo próprio, com dados descartáveis numa pasta temporária, e a derruba
// no fim. Uso: node carga/executar.js --armazenamento final [--cenarios S1,S2]
//             [--trava <pasta>] [--saida <arquivo.json>]
const { fork } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const autocannon = require('autocannon');
const { armazenamentos } = require('./armazenamentos');
const { tomarTrava, liberarAoEncerrar, apagarPasta } = require('./trava');

const PORTA = 3101;
const BASE = `http://127.0.0.1:${PORTA}`;

function argumento(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`);
  return i === -1 ? padrao : process.argv[i + 1];
}

// ---------------------------------------------------------------- servidor
async function subirServidor(adaptador, totalHorarios, envExtra = {}) {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'markaqui-carga-'));
  const dados = await adaptador.semear(pasta, totalHorarios);
  const filho = fork(path.join(__dirname, 'servidor.js'), [], {
    env: {
      ...process.env,
      ...adaptador.env(pasta),
      PORT: String(PORTA),
      NODE_ENV: 'carga',
      ...envExtra,
    },
    stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
  });
  await esperarMensagem(filho, 'pronto');
  const cab = await adaptador.autenticar(BASE, dados);
  return { filho, pasta, dados, cab, adaptador };
}

function esperarMensagem(filho, tipo) {
  return new Promise((resolve, reject) => {
    const aoReceber = (msg) => {
      if (msg.tipo === tipo) {
        filho.off('message', aoReceber);
        resolve(msg);
      }
    };
    filho.on('message', aoReceber);
    filho.once('exit', (code) => reject(new Error(`servidor saiu (${code})`)));
  });
}

async function pedirAoServidor(filho, tipo, resposta) {
  const espera = esperarMensagem(filho, resposta);
  filho.send({ tipo });
  return espera;
}

async function derrubar({ filho, pasta }) {
  if (filho.connected) {
    const saida = new Promise((r) => filho.once('exit', r));
    filho.send({ tipo: 'parar' });
    await saida;
  }
  // Pasta temporária: se o Windows ainda segurar algum arquivo, avisa e segue (a
  // medição não depende disso).
  try {
    apagarPasta(pasta);
  } catch (erro) {
    console.warn(`[carga] pasta temporária não apagada (${pasta}): ${erro.message}`);
  }
}

// ---------------------------------------------------------------- medições
function resumir(r) {
  return {
    rps: Math.round(r.requests.average),
    p50: r.latency.p50,
    p975: r.latency.p97_5,
    p99: r.latency.p99,
    total: r.requests.total,
    s2xx: r['2xx'],
    s4xx: r['4xx'],
    s5xx: r['5xx'],
    erros: r.errors,
    timeouts: r.timeouts,
  };
}

function rodarAutocannon(opcoes) {
  return autocannon({ timeout: 10, ...opcoes });
}

// Aquece 3 s (descartado) e mede; anexa CPU e memória do processo da API.
async function medirVazao(srv, opcoes, { aquecer = true } = {}) {
  if (aquecer) await rodarAutocannon({ ...opcoes, duration: 3 });
  await pedirAoServidor(srv.filho, 'marcar', 'marcado');
  const r = await rodarAutocannon(opcoes);
  const uso = await pedirAoServidor(srv.filho, 'medir', 'medida');
  return { ...resumir(r), cpuPct: Math.round(uso.cpuPct), picoRssMb: Math.round(uso.picoRssMb) };
}

function percentil(valores, p) {
  const ordenados = [...valores].sort((a, b) => a - b);
  return ordenados[Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1)];
}

// Pedido de escrita sem aumentar a base: alterna o bloqueio (ou a disponibilidade,
// na versão antiga) de um horário.
function pedidoDeEscrita(srv) {
  const ids = srv.dados.horarios.map((h) => h.id);
  let n = 0;
  return {
    method: 'PUT',
    setupRequest: (req) => {
      n += 1;
      return {
        ...req,
        path: `/api/horarios/${ids[n % ids.length]}`,
        headers: { ...srv.cab.gestor, 'content-type': 'application/json' },
        body: JSON.stringify(srv.adaptador.corpoEscrita(n)),
      };
    },
  };
}

function pedidoDeLeitura(srv) {
  return {
    method: 'GET',
    path: '/api/horarios?medico_id=m1',
    headers: srv.cab.gestor,
  };
}

// ---------------------------------------------------------------- cenários
const cenarios = {
  async S1(adaptador) {
    const srv = await subirServidor(adaptador, 100);
    try {
      const r = await medirVazao(srv, { url: BASE, connections: 50, duration: 15, requests: [pedidoDeLeitura(srv)] });
      return [{ cenario: 'S1', variante: '100 horários, 50 conexões', ...r }];
    } finally {
      await derrubar(srv);
    }
  },

  async S1b(adaptador) {
    const linhas = [];
    for (const total of [1000, 10000]) {
      const srv = await subirServidor(adaptador, total);
      try {
        const r = await medirVazao(srv, { url: BASE, connections: 50, duration: 15, requests: [pedidoDeLeitura(srv)] });
        linhas.push({ cenario: 'S1b', variante: `${total} horários, 50 conexões`, ...r });
      } finally {
        await derrubar(srv);
      }
    }
    return linhas;
  },

  // Corretude: 20 pedidos simultâneos por horário; só um pode ser aceito.
  async S2(adaptador) {
    const HORARIOS = 200;
    const POR_HORARIO = 20;
    const EM_VOO = 200;
    const srv = await subirServidor(adaptador, HORARIOS);
    try {
      const fila = [];
      for (let t = 0; t < POR_HORARIO; t++) {
        for (const h of srv.dados.horarios) fila.push({ horarioId: h.id, paciente: t });
      }
      const latencias = [];
      const status = {};
      let proximo = 0;
      const inicio = performance.now();
      await pedirAoServidor(srv.filho, 'marcar', 'marcado');
      async function trabalhador() {
        while (proximo < fila.length) {
          const { horarioId, paciente } = fila[proximo++];
          const t0 = performance.now();
          const resp = await fetch(`${BASE}/api/agendamentos`, {
            method: 'POST',
            headers: { ...srv.cab.pacientes[paciente % srv.cab.pacientes.length], 'content-type': 'application/json' },
            body: JSON.stringify(adaptador.corpoAgendamento(horarioId, paciente)),
          });
          await resp.arrayBuffer();
          latencias.push(performance.now() - t0);
          status[resp.status] = (status[resp.status] || 0) + 1;
        }
      }
      await Promise.all(Array.from({ length: EM_VOO }, trabalhador));
      const duracaoS = (performance.now() - inicio) / 1000;
      const uso = await pedirAoServidor(srv.filho, 'medir', 'medida');

      const ativos = await adaptador.agendamentosAtivos(BASE, srv.cab);
      const porHorario = new Map();
      for (const a of ativos) porHorario.set(a.horario_id, (porHorario.get(a.horario_id) || 0) + 1);
      const duplicados = [...porHorario.values()].filter((n) => n > 1).length;
      const respH = await fetch(`${BASE}/api/horarios`, { headers: srv.cab.gestor });
      const horarios = await respH.json();
      const livresComAgendamento = horarios.filter((h) => h.disponivel && porHorario.has(h.id)).length;

      return [
        {
          cenario: 'S2',
          variante: `${HORARIOS} horários x ${POR_HORARIO} pedidos (${EM_VOO} em voo)`,
          rps: Math.round(fila.length / duracaoS),
          p50: Math.round(percentil(latencias, 50)),
          p95: Math.round(percentil(latencias, 95)),
          p975: Math.round(percentil(latencias, 97.5)),
          p99: Math.round(percentil(latencias, 99)),
          total: fila.length,
          status,
          aceitos: status[201] || 0,
          ativos: ativos.length,
          duplicados,
          livresComAgendamento,
          cpuPct: Math.round(uso.cpuPct),
          picoRssMb: Math.round(uso.picoRssMb),
        },
      ];
    } finally {
      await derrubar(srv);
    }
  },

  // Teto de escrita: a fila global (JSON) não deixa a vazão subir com a concorrência.
  async S3(adaptador) {
    const linhas = [];
    for (const total of [100, 10000]) {
      const srv = await subirServidor(adaptador, total);
      try {
        for (const conexoes of [1, 10, 50, 100]) {
          const r = await medirVazao(
            srv,
            { url: BASE, connections: conexoes, duration: 10, requests: [pedidoDeEscrita(srv)] },
            { aquecer: conexoes === 1 }
          );
          linhas.push({ cenario: 'S3', variante: `${total} horários, ${conexoes} conexões`, ...r });
        }
      } finally {
        await derrubar(srv);
      }
    }
    return linhas;
  },

  // Misto 90% leitura e 10% escrita em degraus, com 10.000 horários.
  async S4(adaptador) {
    const linhas = [];
    const srv = await subirServidor(adaptador, 10000);
    try {
      const leitura = pedidoDeLeitura(srv);
      const escrita = pedidoDeEscrita(srv);
      const requests = [...Array(9).fill(leitura), escrita];
      for (const conexoes of [10, 50, 100, 200, 300]) {
        const r = await medirVazao(
          srv,
          { url: BASE, connections: conexoes, duration: 10, requests },
          { aquecer: conexoes === 10 }
        );
        linhas.push({ cenario: 'S4', variante: `10.000 horários, ${conexoes} conexões`, ...r });
      }
    } finally {
      await derrubar(srv);
    }
    return linhas;
  },

  // Leitores e escritores ao mesmo tempo: no JSON, o rename troca o arquivo que
  // os leitores estão abrindo.
  async S5(adaptador) {
    const srv = await subirServidor(adaptador, 1000);
    try {
      await pedirAoServidor(srv.filho, 'marcar', 'marcado');
      const [leitores, escritores] = await Promise.all([
        rodarAutocannon({ url: BASE, connections: 50, duration: 20, requests: [pedidoDeLeitura(srv)] }),
        rodarAutocannon({ url: BASE, connections: 50, duration: 20, requests: [pedidoDeEscrita(srv)] }),
      ]);
      const uso = await pedirAoServidor(srv.filho, 'medir', 'medida');
      return [
        {
          cenario: 'S5',
          variante: '1.000 horários, 50 leitores',
          ...resumir(leitores),
          cpuPct: Math.round(uso.cpuPct),
          picoRssMb: Math.round(uso.picoRssMb),
        },
        { cenario: 'S5', variante: '1.000 horários, 50 escritores', ...resumir(escritores) },
      ];
    } finally {
      await derrubar(srv);
    }
  },

  // Login com bcrypt (só na versão com login): vazão sem limitador e, depois, o
  // limitador padrão (5 por minuto por IP) devolvendo 429.
  async S6(adaptador) {
    if (!adaptador.temLogin) return [];
    const linhas = [];
    const srv = await subirServidor(adaptador, 100);
    try {
      const corpo = JSON.stringify(adaptador.credenciais.pacientes[0]);
      for (const conexoes of [1, 10, 50]) {
        const r = await medirVazao(
          srv,
          {
            url: `${BASE}/api/auth/login`,
            connections: conexoes,
            duration: 10,
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: corpo,
          },
          { aquecer: conexoes === 1 }
        );
        linhas.push({ cenario: 'S6', variante: `login (bcrypt custo 10), ${conexoes} conexões`, ...r });
      }
    } finally {
      await derrubar(srv);
    }
    const limitado = await subirServidor(adaptador, 100, { LIMITE_AUTH_POR_MINUTO: '5' });
    try {
      const status = [];
      for (let i = 0; i < 8; i++) {
        const resp = await fetch(`${BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: 'nao-existe@carga.dev', senha: 'Errada123' }),
        });
        status.push(resp.status);
      }
      linhas.push({
        cenario: 'S6',
        variante: 'limitador padrão: 8 logins errados seguidos',
        sequencia: status.join(' '),
      });
    } finally {
      await derrubar(limitado);
    }
    return linhas;
  },

  // Corpo grande: 90 KB no nome do médico.
  async S7(adaptador) {
    const srv = await subirServidor(adaptador, 1000);
    try {
      const antes = await medirVazao(srv, {
        url: BASE,
        connections: 50,
        duration: 5,
        requests: [pedidoDeLeitura(srv)],
      });
      const corpo = JSON.stringify({ nome: 'x'.repeat(90 * 1024), especialidade: 'Clínica Geral' });
      const envio = await medirVazao(
        srv,
        {
          // O autocannon ignora `path` fora de `requests`: o caminho vai na URL.
          url: `${BASE}/api/medicos`,
          connections: 10,
          duration: 5,
          method: 'POST',
          headers: { ...srv.cab.gestor, 'content-type': 'application/json' },
          body: corpo,
        },
        { aquecer: false }
      );
      const tamanhoMb = adaptador.tamanhoDosDados(srv.pasta) / 1048576;
      const depois = await medirVazao(srv, {
        url: BASE,
        connections: 50,
        duration: 5,
        requests: [pedidoDeLeitura(srv)],
      });
      return [
        { cenario: 'S7', variante: 'leitura antes dos corpos grandes', ...antes },
        {
          cenario: 'S7',
          variante: 'POST /api/medicos com 90 KB, 10 conexões',
          ...envio,
          arquivoMb: Number(tamanhoMb.toFixed(1)),
        },
        { cenario: 'S7', variante: 'leitura depois dos corpos grandes', ...depois },
      ];
    } finally {
      await derrubar(srv);
    }
  },
};

// ---------------------------------------------------------------- principal
async function principal() {
  const nome = argumento('armazenamento', 'json');
  const adaptador = armazenamentos[nome];
  if (!adaptador) throw new Error(`armazenamento desconhecido: ${nome}`);
  const lista = argumento('cenarios', Object.keys(cenarios).join(',')).split(',');
  // Trava compartilhada entre os projetos da máquina (uma carga por vez). Só caminho
  // absoluto: relativo criaria uma pasta em outro lugar e não protegeria nada.
  const trava = argumento('trava', process.env.CARGA_TRAVA);
  if (trava && !path.isAbsolute(trava)) {
    console.error(`--trava precisa ser um caminho absoluto (recebido: ${trava}).`);
    process.exitCode = 1;
    return;
  }
  const saida = argumento('saida');

  // A trava guarda o dono (projeto, pid, início) e se solta também em Ctrl+C e
  // SIGTERM, que pulam o finally.
  let travaTomada = null;
  if (trava) {
    try {
      travaTomada = tomarTrava(trava, { projeto: 'markaqui' });
    } catch (e) {
      if (e.code === 'TRAVA_OCUPADA') {
        console.error(e.message);
        process.exitCode = 2;
        return;
      }
      throw e;
    }
    liberarAoEncerrar(travaTomada);
  }
  const linhas = [];
  // Janela da medição (com a trava já tomada), para conferir sobreposição com outras cargas.
  const inicio = new Date().toISOString();
  let fim;
  try {
    for (const c of lista) {
      if (!cenarios[c]) {
        console.log(`Cenário ${c} não existe neste armazenamento; pulando.`);
        continue;
      }
      console.log(`== ${c} (${nome})`);
      const resultado = await cenarios[c](adaptador);
      for (const l of resultado) console.log(JSON.stringify(l));
      linhas.push(...resultado);
    }
  } finally {
    fim = new Date().toISOString();
    if (travaTomada) travaTomada.liberar();
  }

  if (saida) {
    fs.mkdirSync(path.dirname(saida), { recursive: true });
    fs.writeFileSync(
      saida,
      JSON.stringify(
        {
          armazenamento: nome,
          data: new Date().toISOString(),
          medicaoInicio: inicio,
          medicaoFim: fim,
          trava: trava ? path.basename(trava) : null,
          node: process.version,
          cpu: os.cpus()[0].model,
          nucleos: os.cpus().length,
          memoriaGb: Math.round(os.totalmem() / 1073741824),
          linhas,
        },
        null,
        2
      ) + '\n'
    );
    console.log(`Resumo gravado em ${saida}`);
  }
}

principal().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
