// services/api.js
// O endereço da API vem de EXPO_PUBLIC_API_URL (arquivo .env nesta pasta; modelo em
// .env.example). O Expo só substitui a variável quando ela é lida exatamente assim:
// process.env.EXPO_PUBLIC_API_URL. Reinicie o Expo depois de mudar o .env.
import { resolverApiUrl, erroDaApi } from './http';

const API_URL = resolverApiUrl(process.env.EXPO_PUBLIC_API_URL);

async function requisitar(caminho, opcoes, mensagemPadrao) {
  try {
    const response = await fetch(`${API_URL}${caminho}`, opcoes);
    const corpo = await response.json().catch(() => null);

    if (!response.ok) {
      throw erroDaApi(response.status, corpo, mensagemPadrao);
    }

    return corpo;
  } catch (error) {
    console.error(`${mensagemPadrao}:`, error);
    throw error;
  }
}

const comJson = (method, dados) => ({
  method,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(dados),
});

// ============================================
// MÉDICOS
// ============================================

export const buscarMedicos = () =>
  requisitar('/medicos', undefined, 'Erro ao buscar médicos');

export const buscarMedicoPorId = (id) =>
  requisitar(`/medicos/${id}`, undefined, 'Médico não encontrado');

export const cadastrarMedico = (medico) =>
  requisitar('/medicos', comJson('POST', medico), 'Erro ao cadastrar médico');

export const atualizarMedico = (id, medico) =>
  requisitar(`/medicos/${id}`, comJson('PUT', medico), 'Erro ao atualizar médico');

// Responde 409 (erro.status) quando o médico ainda tem agendamentos.
export const removerMedico = (id) =>
  requisitar(`/medicos/${id}`, { method: 'DELETE' }, 'Erro ao remover médico');

// ============================================
// HORÁRIOS (cada horário pertence a um médico)
// ============================================

// Sem medicoId traz todos os horários; com medicoId, só a agenda daquele médico.
export const buscarHorarios = (medicoId) => {
  const filtro = medicoId ? `?medico_id=${encodeURIComponent(medicoId)}` : '';
  return requisitar(`/horarios${filtro}`, undefined, 'Erro ao buscar horários');
};

export const buscarHorarioPorId = (id) =>
  requisitar(`/horarios/${id}`, undefined, 'Horário não encontrado');

// horario = { medico_id, data, hora, disponivel }
export const cadastrarHorario = (horario) =>
  requisitar('/horarios', comJson('POST', horario), 'Erro ao cadastrar horário');

// A API só aceita disponivel, data e hora.
export const atualizarHorario = (id, horario) =>
  requisitar(`/horarios/${id}`, comJson('PUT', horario), 'Erro ao atualizar horário');

export const removerHorario = (id) =>
  requisitar(`/horarios/${id}`, { method: 'DELETE' }, 'Erro ao remover horário');

// ============================================
// AGENDAMENTOS (horário + médico + paciente)
// ============================================

// agendamento = { horario_id, medico_id, paciente_nome }; medico_id precisa ser o do horário.
export const agendarConsulta = (agendamento) =>
  requisitar('/agendamentos', comJson('POST', agendamento), 'Erro ao agendar consulta');

export const buscarAgendamentos = () =>
  requisitar('/agendamentos', undefined, 'Erro ao buscar agendamentos');

export const cancelarAgendamento = (id) =>
  requisitar(`/agendamentos/${id}`, { method: 'DELETE' }, 'Erro ao cancelar agendamento');
