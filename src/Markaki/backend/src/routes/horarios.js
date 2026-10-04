const express = require('express');
const horarios = require('../services/horarios');
const { validarNovoHorario, validarEdicaoHorario } = require('../validators/horario');
const { criarManipuladores } = require('../middlewares/erros');
const { exigirPapel } = require('../middlewares/autenticacao');

function rotasHorarios(armazenamento, config) {
  const { ler, gravar } = criarManipuladores(armazenamento, config);
  const gestor = exigirPapel('gestor');
  const rotas = express.Router();

  // ?medico_id= filtra a agenda de um médico.
  rotas.get('/', ler('Erro ao buscar horários.', (r, ctx) => {
    const medicoId = typeof ctx.query.medico_id === 'string' ? ctx.query.medico_id : undefined;
    return horarios.listar(r, medicoId, ctx);
  }));
  rotas.get('/:id', ler('Erro ao buscar horário.', (r, ctx) => horarios.detalhar(r, ctx.params.id, ctx)));
  rotas.post('/', gestor, gravar('Erro ao cadastrar horário.', (r, dados, ctx) => horarios.cadastrar(r, dados, ctx), {
    status: 201,
    validar: validarNovoHorario,
  }));
  rotas.put('/:id', gestor, gravar('Erro ao atualizar horário.',
    (r, dados, ctx) => horarios.atualizar(r, ctx.params.id, dados, ctx), { validar: validarEdicaoHorario }));
  rotas.delete('/:id', gestor, gravar('Erro ao remover horário.',
    (r, _, ctx) => horarios.remover(r, ctx.params.id)));

  return rotas;
}

module.exports = { rotasHorarios };
