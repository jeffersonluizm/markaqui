// Um horário pode estar indisponível por dois motivos: foi agendado (tem paciente, ver
// POST /api/agendamentos no backend) ou foi bloqueado à mão. Só o bloqueio manual pode
// ser desfeito ou removido direto; o agendado só é liberado cancelando o agendamento.
export function estaAgendado(horario) {
  return !horario.disponivel && Boolean(horario.paciente_nome);
}
