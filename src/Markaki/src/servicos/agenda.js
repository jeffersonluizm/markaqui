// Regras puras de apresentação da agenda (testadas com node --test).

// [{ data, horarios: [...] }] na ordem em que os horários chegaram (a API já ordena).
export function agruparPorDia(horarios) {
  const grupos = [];
  for (const h of horarios) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.data === h.data) ultimo.horarios.push(h);
    else grupos.push({ data: h.data, horarios: [h] });
  }
  return grupos;
}

const chave = (c) => `${c.data}T${c.hora}`;

// Próximas consultas (agendadas, da mais perto para a mais longe) e histórico
// (canceladas e realizadas, da mais recente para a mais antiga).
export function separarConsultas(consultas) {
  const proximas = consultas.filter((c) => c.situacao === 'agendado').sort((a, b) => chave(a).localeCompare(chave(b)));
  const historico = consultas.filter((c) => c.situacao !== 'agendado').sort((a, b) => chave(b).localeCompare(chave(a)));
  return { proximas, historico };
}

const dois = (n) => String(n).padStart(2, '0');

export function proximosDias(quantidade, hoje = new Date()) {
  const dias = [];
  for (let i = 1; i <= quantidade; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    dias.push(`${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`);
  }
  return dias;
}

export function gradeDeHoras({ inicio = '07:00', fim = '19:00', passoMin = 30 } = {}) {
  const minutos = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const horas = [];
  for (let m = minutos(inicio); m < minutos(fim); m += passoMin) {
    horas.push(`${dois(Math.floor(m / 60))}:${dois(m % 60)}`);
  }
  return horas;
}

export function especialidades(medicos) {
  return [...new Set(medicos.map((m) => m.especialidade))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
