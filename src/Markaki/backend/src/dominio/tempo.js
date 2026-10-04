// Datas e horas da agenda são da clínica (horário local): data "AAAA-MM-DD" e
// hora "HH:MM". Como textos nesse formato ordenam como datas, comparar a chave
// "AAAA-MM-DDTHH:MM" basta para saber o que é passado ou futuro.
const doisDigitos = (n) => String(n).padStart(2, '0');

function momentoLocal(data) {
  const dia = `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
  const hora = `${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
  return { data: dia, hora, chave: `${dia}T${hora}` };
}

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

module.exports = { momentoLocal, chave, ehFuturo, somarDias, dataValida, horaValida };
