const express = require('express');
const horarios = require('../services/horarios');
const { validarNovoHorario, validarEdicaoHorario } = require('../validators/horario');
const { criarManipuladores } = require('../middlewares/erros');

function rotasHorarios(armazenamento) {
  const { ler, gravar } = criarManipuladores(armazenamento);
  const rotas = express.Router();

  // Todos os horários, ou só os de um médico com ?medico_id=
  rotas.get('/', ler('Erro ao buscar horários', (r, req) => r.horarios.listar(req.query.medico_id)));
  rotas.get('/:id', ler('Erro ao buscar horário', (r, req) => horarios.buscar(r, req.params.id)));
  rotas.post('/', gravar('Erro ao cadastrar horário', (r, dados) => horarios.cadastrar(r, dados), {
    status: 201,
    validar: validarNovoHorario,
  }));
  rotas.put('/:id', gravar(
    'Erro ao atualizar horário',
    (r, dados, req) => horarios.atualizar(r, req.params.id, dados),
    { validar: validarEdicaoHorario }
  ));
  rotas.delete('/:id', gravar('Erro ao remover horário', (r, _, req) => horarios.remover(r, req.params.id)));

  return rotas;
}

module.exports = { rotasHorarios };
