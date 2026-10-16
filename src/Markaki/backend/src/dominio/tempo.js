// Datas e horas da agenda são da clínica: data "AAAA-MM-DD" e hora "HH:MM" no fuso
// dela (FUSO_HORARIO, padrão America/Sao_Paulo), qualquer que seja o fuso do
// servidor (na hospedagem ele roda em UTC). Como textos nesse formato ordenam como
// datas, comparar a chave "AAAA-MM-DDTHH:MM" basta para saber o que é passado ou futuro.
const FUSO_PADRAO = process.env.FUSO_HORARIO || 'America/Sao_Paulo';
const formatadores = new Map();

function formatador(fuso) {
  if (!formatadores.has(fuso)) {
    formatadores.set(
      fuso,
      new Intl.DateTimeFormat('en-CA', {
        timeZone: fuso,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
    );
  }
  return formatadores.get(fuso);
}

function momentoNoFuso(data, fuso) {
  const p = Object.fromEntries(
    formatador(fuso)
      .formatToParts(data)
      .map(({ type, value }) => [type, value])
  );
  const dia = `${p.year}-${p.month}-${p.day}`;
  const hora = `${p.hour}:${p.minute}`;
  return { data: dia, hora, chave: `${dia}T${hora}` };
}

const momentoLocal = (data) => momentoNoFuso(data, FUSO_PADRAO);

const chave = (data, hora) => `${data}T${hora}`;

function ehFuturo(data, hora, agora) {
  return chave(data, hora) > momentoLocal(agora).chave;
}

function somarDias(dataTexto, dias) {
  const [a, m, d] = dataTexto.split('-').map(Number);
  const resultado = new Date(Date.UTC(a, m - 1, d + dias));
  return resultado.toISOString().slice(0, 10);
}

function dataValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [a, m, d] = texto.split('-').map(Number);
  const data = new Date(Date.UTC(a, m - 1, d));
  return data.getUTCFullYear() === a && data.getUTCMonth() === m - 1 && data.getUTCDate() === d;
}

const horaValida = (texto) => /^([01]\d|2[0-3]):[0-5]\d$/.test(texto);

module.exports = { FUSO_PADRAO, momentoNoFuso, momentoLocal, chave, ehFuturo, somarDias, dataValida, horaValida };
