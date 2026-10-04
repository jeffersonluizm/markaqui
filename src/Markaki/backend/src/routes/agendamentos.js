const express = require('express');
const agendamentos = require('../services/agendamentos');
const painel = require('../services/painel');
const { validarNovoAgendamento } = require('../validators/agendamento');
const { criarManipuladores } = require('../middlewares/erros');
const { exigirPapel } = require('../middlewares/autenticacao');

function rotasAgendamentos(armazenamento, config) {
  const { ler, gravar } = criarManipuladores(armazenamento, config);
  const rotas = express.Router();

  rotas.get('/', ler('Erro ao buscar agendamentos.', (r, ctx) => agendamentos.listar(r, ctx)));
  rotas.get('/:id', ler('Erro ao buscar agendamento.', (r, ctx) => agendamentos.detalhar(r, ctx.params.id, ctx)));
  rotas.post('/', exigirPapel('paciente'), gravar('Erro ao agendar consulta.',
    (r, dados, ctx) => agendamentos.agendar(r, dados, ctx), { status: 201, validar: validarNovoAgendamento }));
  rotas.patch('/:id/cancelar', gravar('Erro ao cancelar consulta.',
    (r, _, ctx) => agendamentos.cancelar(r, ctx.params.id, ctx)));

  return rotas;
}

function rotasPainel(armazenamento, config) {
  const { ler } = criarManipuladores(armazenamento, config);
  const rotas = express.Router();
  rotas.get('/', exigirPapel('gestor'), ler('Erro ao montar o painel.', (r, ctx) => painel.resumo(r, ctx)));
  return rotas;
}

module.exports = { rotasAgendamentos, rotasPainel };
