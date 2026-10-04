// Sobe a API num processo separado para o teste de carga (iniciado por executar.js
// com fork) e responde pelo IPC com o consumo de CPU e de memória desde a última
// marcação. Nunca é usado fora da carga.
const { app } = require('../server');

const porta = Number(process.env.PORT);
const servidor = app.listen(porta, '127.0.0.1', () => process.send({ tipo: 'pronto' }));

let cpuInicial = process.cpuUsage();
let tempoInicial = process.hrtime.bigint();
let picoRss = process.memoryUsage().rss;

setInterval(() => {
  picoRss = Math.max(picoRss, process.memoryUsage().rss);
}, 200).unref();

process.on('message', (msg) => {
  if (msg.tipo === 'marcar') {
    cpuInicial = process.cpuUsage();
    tempoInicial = process.hrtime.bigint();
    picoRss = process.memoryUsage().rss;
    process.send({ tipo: 'marcado' });
  } else if (msg.tipo === 'medir') {
    const cpu = process.cpuUsage(cpuInicial);
    const decorridoMs = Number(process.hrtime.bigint() - tempoInicial) / 1e6;
    process.send({
      tipo: 'medida',
      cpuPct: ((cpu.user + cpu.system) / 1000 / decorridoMs) * 100,
      picoRssMb: picoRss / 1048576,
    });
  } else if (msg.tipo === 'parar') {
    servidor.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  }
});
