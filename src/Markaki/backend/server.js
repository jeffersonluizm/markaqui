const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
// DATA_FILE permite apontar para outro arquivo (os testes usam um arquivo temporário).
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function lerDados() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      medicos: [],
      horarios: [],
      agendamentos: []
    };
  }
}

async function salvarDados(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// UUID: Date.now() repetia o id quando dois cadastros caíam no mesmo milissegundo.
function gerarId() {
  return crypto.randomUUID();
}

// ============================================
// ROTAS - MÉDICOS
// ============================================

// Listar todos os médicos
app.get('/api/medicos', async (req, res) => {
  try {
    const dados = await lerDados();
    res.json(dados.medicos);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar médicos' });
  }
});

// Buscar médico por ID
app.get('/api/medicos/:id', async (req, res) => {
  try {
    const dados = await lerDados();
    const medico = dados.medicos.find(m => m.id === req.params.id);
    
    if (!medico) {
      return res.status(404).json({ erro: 'Médico não encontrado' });
    }
    
    res.json(medico);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar médico' });
  }
});

// Cadastrar novo médico
app.post('/api/medicos', async (req, res) => {
  try {
    const { nome, especialidade, imagem } = req.body;
    
    if (!nome || !especialidade) {
      return res.status(400).json({ 
        erro: 'Nome e especialidade são obrigatórios' 
      });
    }
    
    const dados = await lerDados();
    
    const novoMedico = {
      id: gerarId(),
      nome,
      especialidade,
      imagem: imagem || 'https://via.placeholder.com/80'
    };
    
    dados.medicos.push(novoMedico);
    await salvarDados(dados);
    
    res.status(201).json(novoMedico);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao cadastrar médico' });
  }
});

// Atualizar médico
app.put('/api/medicos/:id', async (req, res) => {
  try {
    const { nome, especialidade, imagem } = req.body;
    const dados = await lerDados();
    const index = dados.medicos.findIndex(m => m.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ erro: 'Médico não encontrado' });
    }
    
    dados.medicos[index] = {
      ...dados.medicos[index],
      nome: nome || dados.medicos[index].nome,
      especialidade: especialidade || dados.medicos[index].especialidade,
      imagem: imagem || dados.medicos[index].imagem
    };
    
    await salvarDados(dados);
    res.json(dados.medicos[index]);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar médico' });
  }
});

// Remover médico
app.delete('/api/medicos/:id', async (req, res) => {
  try {
    const dados = await lerDados();
    const id = req.params.id;
    const medicosFiltrados = dados.medicos.filter(m => m.id !== id);
    
    if (dados.medicos.length === medicosFiltrados.length) {
      return res.status(404).json({ erro: 'Médico não encontrado' });
    }

    // Com consulta marcada o médico não sai: os agendamentos ficariam órfãos.
    const agendamentosDoMedico = dados.agendamentos.filter(a => a.medico_id === id);
    if (agendamentosDoMedico.length > 0) {
      return res.status(409).json({
        erro: `Este médico tem ${agendamentosDoMedico.length} agendamento(s). Cancele os agendamentos primeiro.`
      });
    }

    // Sem agendamentos, os horários que sobram do médico são livres ou bloqueados.
    // Eles saem junto: sem o médico ninguém poderia agendá-los.
    const horariosRestantes = dados.horarios.filter(h => h.medico_id !== id);
    const horariosRemovidos = dados.horarios.length - horariosRestantes.length;
    
    dados.medicos = medicosFiltrados;
    dados.horarios = horariosRestantes;
    await salvarDados(dados);
    
    res.json({
      mensagem: 'Médico removido com sucesso',
      horarios_removidos: horariosRemovidos
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover médico' });
  }
});

// ============================================
// ROTAS - HORÁRIOS
// ============================================

// Listar horários (todos, ou só os de um médico com ?medico_id=)
app.get('/api/horarios', async (req, res) => {
  try {
    const dados = await lerDados();
    const { medico_id } = req.query;
    const horarios = medico_id
      ? dados.horarios.filter(h => h.medico_id === medico_id)
      : dados.horarios;
    res.json(horarios);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar horários' });
  }
});

// Buscar horário por ID
app.get('/api/horarios/:id', async (req, res) => {
  try {
    const dados = await lerDados();
    const horario = dados.horarios.find(h => h.id === req.params.id);
    
    if (!horario) {
      return res.status(404).json({ erro: 'Horário não encontrado' });
    }
    
    res.json(horario);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar horário' });
  }
});

// Cadastrar novo horário
app.post('/api/horarios', async (req, res) => {
  try {
    const { data, hora, disponivel, medico_id } = req.body;
    
    if (!data || !hora || !medico_id) {
      return res.status(400).json({ 
        erro: 'Médico, data e hora são obrigatórios' 
      });
    }
    
    const dados = await lerDados();

    // O horário pertence a um médico: é a agenda dele.
    const medico = dados.medicos.find(m => m.id === medico_id);
    if (!medico) {
      return res.status(400).json({ erro: 'Médico não encontrado' });
    }

    // Dois médicos podem ter o mesmo horário; o mesmo médico, não.
    const repetido = dados.horarios.some(
      h => h.medico_id === medico_id && h.data === data && h.hora === hora
    );
    if (repetido) {
      return res.status(409).json({
        erro: 'Este médico já tem um horário cadastrado nessa data e hora'
      });
    }
    
    const novoHorario = {
      id: gerarId(),
      data,
      hora,
      disponivel: disponivel !== undefined ? disponivel : true,
      paciente_nome: '',
      medico_id,
      medico_nome: medico.nome
    };
    
    dados.horarios.push(novoHorario);
    await salvarDados(dados);
    
    res.status(201).json(novoHorario);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao cadastrar horário' });
  }
});

// Atualizar horário
app.put('/api/horarios/:id', async (req, res) => {
  try {
    const dados = await lerDados();
    const index = dados.horarios.findIndex(h => h.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ erro: 'Horário não encontrado' });
    }
    
    dados.horarios[index] = {
      ...dados.horarios[index],
      ...req.body
    };
    
    await salvarDados(dados);
    res.json(dados.horarios[index]);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar horário' });
  }
});

// Remover horário
app.delete('/api/horarios/:id', async (req, res) => {
  try {
    const dados = await lerDados();
    const horariosFiltrados = dados.horarios.filter(h => h.id !== req.params.id);
    
    if (dados.horarios.length === horariosFiltrados.length) {
      return res.status(404).json({ erro: 'Horário não encontrado' });
    }
    
    dados.horarios = horariosFiltrados;
    await salvarDados(dados);
    
    res.json({ mensagem: 'Horário removido com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao remover horário' });
  }
});

// ============================================
// ROTAS - AGENDAMENTOS
// ============================================

// Listar todos os agendamentos
app.get('/api/agendamentos', async (req, res) => {
  try {
    const dados = await lerDados();
    res.json(dados.agendamentos);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar agendamentos' });
  }
});

// Criar novo agendamento
app.post('/api/agendamentos', async (req, res) => {
  try {
    const { horario_id, medico_id, paciente_nome } = req.body;
    
    if (!horario_id || !paciente_nome) {
      return res.status(400).json({ 
        erro: 'Horário e nome do paciente são obrigatórios' 
      });
    }
    
    const dados = await lerDados();
    
    // Verificar se o horário existe e está disponível
    const horario = dados.horarios.find(h => h.id === horario_id);
    if (!horario) {
      return res.status(404).json({ erro: 'Horário não encontrado' });
    }
    
    if (!horario.disponivel) {
      return res.status(400).json({ erro: 'Horário não está disponível' });
    }
    
    // O médico da consulta é o dono do horário. Horário antigo sem médico
    // (cadastrado antes da agenda por médico) não pode ser agendado.
    if (!horario.medico_id) {
      return res.status(400).json({
        erro: 'Este horário não tem médico. Cadastre o horário na agenda de um médico.'
      });
    }

    if (medico_id && medico_id !== horario.medico_id) {
      return res.status(400).json({
        erro: 'O horário escolhido não pertence a este médico'
      });
    }

    const medico = dados.medicos.find(m => m.id === horario.medico_id);
    if (!medico) {
      return res.status(404).json({ erro: 'Médico não encontrado' });
    }
    
    // Criar agendamento
    const novoAgendamento = {
      id: gerarId(),
      horario_id,
      medico_id: medico.id,
      medico_nome: medico.nome,
      medico_especialidade: medico.especialidade,
      paciente_nome,
      data: horario.data,
      hora: horario.hora,
      status: 'agendado',
      criado_em: new Date().toISOString()
    };
    
    // Marcar horário como não disponível
    const horarioIndex = dados.horarios.findIndex(h => h.id === horario_id);
    dados.horarios[horarioIndex].disponivel = false;
    dados.horarios[horarioIndex].paciente_nome = paciente_nome;
    
    dados.agendamentos.push(novoAgendamento);
    await salvarDados(dados);
    
    res.status(201).json(novoAgendamento);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ erro: 'Erro ao criar agendamento' });
  }
});

// Cancelar agendamento
app.delete('/api/agendamentos/:id', async (req, res) => {
  try {
    const dados = await lerDados();
    const agendamento = dados.agendamentos.find(a => a.id === req.params.id);
    
    if (!agendamento) {
      return res.status(404).json({ erro: 'Agendamento não encontrado' });
    }
    
    // Liberar o horário (ele continua na agenda do mesmo médico)
    const horarioIndex = dados.horarios.findIndex(h => h.id === agendamento.horario_id);
    if (horarioIndex !== -1) {
      dados.horarios[horarioIndex].disponivel = true;
      dados.horarios[horarioIndex].paciente_nome = '';
    }
    
    // Remover agendamento
    dados.agendamentos = dados.agendamentos.filter(a => a.id !== req.params.id);
    await salvarDados(dados);
    
    res.json({ mensagem: 'Agendamento cancelado com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao cancelar agendamento' });
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================

// Só sobe o servidor quando executado direto (node server.js); os testes importam o app.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📋 Endpoints disponíveis:`);
    console.log(`   - GET/POST    /api/medicos`);
    console.log(`   - GET/POST    /api/horarios`);
    console.log(`   - GET/POST    /api/agendamentos`);
  });
}

module.exports = { app, gerarId };
