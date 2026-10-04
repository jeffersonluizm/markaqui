const express = require('express');
const horarios = require('../services/horarios');
const { validarNovoHorario } = require('../validators/horario');
const { responder } = require('../middlewares/erros');

function rotasHorarios(armazenamento) {
  const rotas = express.Router();

  // Todos os horários, ou só os de um médico com ?medico_id=
  rotas.get('/', responder('Erro ao buscar horários', async (req) => ({
    corpo: await armazenamento.leitura((r) => horarios.listar(r, req.query.medico_id)),
  })));

  rotas.get('/:id', responder('Erro ao buscar horário', async (req) => ({
    corpo: await armazenamento.leitura((r) => horarios.buscar(r, req.params.id)),
  })));

  rotas.post('/', responder('Erro ao cadastrar horário', async (req) => {
    const novo = validarNovoHorario(req.body || {});
    return {
      status: 201,
      corpo: await armazenamento.escrita((r) => horarios.cadastrar(r, novo)),
    };
  }));

  rotas.put('/:id', responder('Erro ao atualizar horário', async (req) => ({
    corpo: await armazenamento.escrita((r) => horarios.atualizar(r, req.params.id, req.body || {})),
  })));

  rotas.delete('/:id', responder('Erro ao remover horário', async (req) => ({
    corpo: await armazenamento.escrita((r) => horarios.remover(r, req.params.id)),
  })));

  return rotas;
}

module.exports = { rotasHorarios };
