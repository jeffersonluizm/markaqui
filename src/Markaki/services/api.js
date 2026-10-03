// services/api.js
// Configure o IP do seu computador aqui
const API_URL = 'http://192.168.0.10:3000/api';

// ============================================
// MÉDICOS
// ============================================

export const buscarMedicos = async () => {
  try {
    const response = await fetch(`${API_URL}/medicos`);
    if (!response.ok) throw new Error('Erro ao buscar médicos');
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar médicos:', error);
    throw error;
  }
};

export const buscarMedicoPorId = async (id) => {
  try {
    const response = await fetch(`${API_URL}/medicos/${id}`);
    if (!response.ok) throw new Error('Médico não encontrado');
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar médico:', error);
    throw error;
  }
};

export const cadastrarMedico = async (medico) => {
  try {
    const response = await fetch(`${API_URL}/medicos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(medico),
    });
    
    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.erro || 'Erro ao cadastrar médico');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao cadastrar médico:', error);
    throw error;
  }
};

export const atualizarMedico = async (id, medico) => {
  try {
    const response = await fetch(`${API_URL}/medicos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(medico),
    });
    
    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.erro || 'Erro ao atualizar médico');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao atualizar médico:', error);
    throw error;
  }
};

export const removerMedico = async (id) => {
  try {
    const response = await fetch(`${API_URL}/medicos/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.erro || 'Erro ao remover médico');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao remover médico:', error);
    throw error;
  }
};

// ============================================
// HORÁRIOS
// ============================================

export const buscarHorarios = async () => {
  try {
    const response = await fetch(`${API_URL}/horarios`);
    if (!response.ok) throw new Error('Erro ao buscar horários');
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar horários:', error);
    throw error;
  }
};

export const buscarHorarioPorId = async (id) => {
  try {
    const response = await fetch(`${API_URL}/horarios/${id}`);
    if (!response.ok) throw new Error('Horário não encontrado');
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar horário:', error);
    throw error;
  }
};

export const cadastrarHorario = async (horario) => {
  try {
    const response = await fetch(`${API_URL}/horarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(horario),
    });
    
    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.erro || 'Erro ao cadastrar horário');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao cadastrar horário:', error);
    throw error;
  }
};

export const atualizarHorario = async (id, horario) => {
  try {
    const response = await fetch(`${API_URL}/horarios/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(horario),
    });
    
    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.erro || 'Erro ao atualizar horário');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao atualizar horário:', error);
    throw error;
  }
};

export const removerHorario = async (id) => {
  try {
    const response = await fetch(`${API_URL}/horarios/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.erro || 'Erro ao remover horário');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao remover horário:', error);
    throw error;
  }
};

// ============================================
// AGENDAMENTOS (horário + médico + paciente)
// ============================================

export const agendarConsulta = async (agendamento) => {
  try {
    const response = await fetch(`${API_URL}/agendamentos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(agendamento),
    });
    
    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.erro || 'Erro ao agendar consulta');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao agendar consulta:', error);
    throw error;
  }
};

export const buscarAgendamentos = async () => {
  try {
    const response = await fetch(`${API_URL}/agendamentos`);
    if (!response.ok) throw new Error('Erro ao buscar agendamentos');
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    throw error;
  }
};

export const cancelarAgendamento = async (id) => {
  try {
    const response = await fetch(`${API_URL}/agendamentos/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.erro || 'Erro ao cancelar agendamento');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    throw error;
  }
};
