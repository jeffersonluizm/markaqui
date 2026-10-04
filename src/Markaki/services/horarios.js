// Um horário pode estar indisponível por dois motivos: foi agendado (tem paciente, ver
// POST /api/agendamentos no backend) ou foi bloqueado à mão. Só o bloqueio manual pode
// ser desfeito ou removido direto; o agendado só é liberado cancelando o agendamento.
export function estaAgendado(horario) {
  return !horario.disponivel && Boolean(horario.paciente_nome);
}

// Agenda por médico: cada horário pertence a um médico (medico_id). Na tela de
// agendamento só entram os horários livres do médico escolhido.
export function horariosDisponiveisDoMedico(horarios, medicoId) {
  if (!medicoId) return [];
  return horarios.filter((h) => h.disponivel && h.medico_id === medicoId);
}

// Nome do médico de um horário. Prefere o nome atual da lista de médicos; horários
// cadastrados antes da agenda por médico não têm médico e não podem ser agendados.
export function rotuloMedico(horario, medicos = []) {
  const medico = medicos.find((m) => m.id === horario.medico_id);
  if (medico) return medico.nome;
  if (horario.medico_id && horario.medico_nome) return horario.medico_nome;
  return 'Sem médico (cadastro antigo)';
}
