const express = require('express');
const agendamentos = require('../services/agendamentos');
const { responder } = require('../middlewares/erros');

function rotasAgendamentos(armazenamento) {
  const rotas = express.Router();

  rotas.get('/', responder('Erro ao buscar agendamentos', async () => ({
    corpo: await armazenamento.leitura((r) => agendamentos.listar(r)),
  })));

  rotas.post('/', responder('Erro ao criar agendamento', async (req) => {
    const corpo = req.body || {};
    agendamentos.validarNovo(corpo);
    return {
      status: 201,
      corpo: await armazenamento.escrita((r) => agendamentos.agendar(r, corpo)),
    };
  }));

  rotas.delete('/:id', responder('Erro ao cancelar agendamento', async (req) => ({
    corpo: await armazenamento.escrita((r) => agendamentos.cancelar(r, req.params.id)),
  })));

  return rotas;
}

module.exports = { rotasAgendamentos };
