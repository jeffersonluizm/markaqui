// Formatação para a tela (pt-BR). As datas da agenda chegam como "AAAA-MM-DD".
const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const TITULOS = new Set(['dr', 'dr.', 'dra', 'dra.', 'sr', 'sr.', 'sra', 'sra.']);
const LIGACOES = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

function partes(data) {
  const [a, m, d] = data.split('-').map(Number);
  return { a, m, d, semana: new Date(Date.UTC(a, m - 1, d)).getUTCDay() };
}

export function iniciais(nome = '') {
  const palavras = nome
    .split(/\s+/)
    .filter((p) => p && !TITULOS.has(p.toLowerCase()) && !LIGACOES.has(p.toLowerCase()));
  if (palavras.length === 0) return '?';
  const primeira = palavras[0][0];
  const ultima = palavras.length > 1 ? palavras[palavras.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

export function dataCurta(data) {
  const { a, m, d } = partes(data);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}`;
}

export const diaDaSemana = (data) => DIAS[partes(data).semana];

export function dataPorExtenso(data) {
  const { m, d, semana } = partes(data);
  return `${DIAS[semana]}, ${d} de ${MESES[m - 1]}`;
}

// Rótulo curto para chips: "sex 01/02".
export function diaCurto(data) {
  const { m, d, semana } = partes(data);
  return `${DIAS[semana].slice(0, 3)} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

export function telefoneFormatado(digitos = '') {
  if (digitos.length === 11) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  if (digitos.length === 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return digitos;
}

export function saudacao(agora = new Date()) {
  const hora = agora.getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export const SITUACOES = {
  agendado: { rotulo: 'Agendada', icone: 'calendar-check' },
  realizado: { rotulo: 'Realizada', icone: 'check-circle-outline' },
  cancelado: { rotulo: 'Cancelada', icone: 'close-circle-outline' },
};
