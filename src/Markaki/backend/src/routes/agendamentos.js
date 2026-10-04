const express = require('express');
const agendamentos = require('../services/agendamentos');
const { validarNovoAgendamento } = require('../validators/agendamento');
const { criarManipuladores } = require('../middlewares/erros');

function rotasAgendamentos(armazenamento) {
  const { ler, gravar } = criarManipuladores(armazenamento);
  const rotas = express.Router();

  rotas.get('/', ler('Erro ao buscar agendamentos', (r) => r.agendamentos.listar()));
  rotas.post('/', gravar('Erro ao criar agendamento', (r, dados) => agendamentos.agendar(r, dados), {
    status: 201,
    validar: validarNovoAgendamento,
  }));
  rotas.delete('/:id', gravar(
    'Erro ao cancelar agendamento',
    (r, _, req) => agendamentos.cancelar(r, req.params.id)
  ));

  return rotas;
}

module.exports = { rotasAgendamentos };
