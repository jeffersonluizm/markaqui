const express = require('express');
const medicos = require('../services/medicos');
const { responder } = require('../middlewares/erros');

function rotasMedicos(armazenamento) {
  const rotas = express.Router();

  rotas.get('/', responder('Erro ao buscar médicos', async () => ({
    corpo: await armazenamento.leitura((r) => medicos.listar(r)),
  })));

  rotas.get('/:id', responder('Erro ao buscar médico', async (req) => ({
    corpo: await armazenamento.leitura((r) => medicos.buscar(r, req.params.id)),
  })));

  rotas.post('/', responder('Erro ao cadastrar médico', async (req) => {
    const corpo = req.body || {};
    medicos.validarNovo(corpo);
    return {
      status: 201,
      corpo: await armazenamento.escrita((r) => medicos.cadastrar(r, corpo)),
    };
  }));

  rotas.put('/:id', responder('Erro ao atualizar médico', async (req) => ({
    corpo: await armazenamento.escrita((r) => medicos.atualizar(r, req.params.id, req.body || {})),
  })));

  rotas.delete('/:id', responder('Erro ao remover médico', async (req) => ({
    corpo: await armazenamento.escrita((r) => medicos.remover(r, req.params.id)),
  })));

  return rotas;
}

module.exports = { rotasMedicos };
