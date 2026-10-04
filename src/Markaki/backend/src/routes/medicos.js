const express = require('express');
const medicos = require('../services/medicos');
const { validarNovoMedico, validarEdicaoMedico } = require('../validators/medico');
const { criarManipuladores } = require('../middlewares/erros');

function rotasMedicos(armazenamento) {
  const { ler, gravar } = criarManipuladores(armazenamento);
  const rotas = express.Router();

  rotas.get('/', ler('Erro ao buscar médicos', (r) => r.medicos.listar()));
  rotas.get('/:id', ler('Erro ao buscar médico', (r, req) => medicos.buscar(r, req.params.id)));
  rotas.post('/', gravar('Erro ao cadastrar médico', (r, dados) => medicos.cadastrar(r, dados), {
    status: 201,
    validar: validarNovoMedico,
  }));
  rotas.put('/:id', gravar(
    'Erro ao atualizar médico',
    (r, dados, req) => medicos.atualizar(r, req.params.id, dados),
    { validar: validarEdicaoMedico }
  ));
  rotas.delete('/:id', gravar('Erro ao remover médico', (r, _, req) => medicos.remover(r, req.params.id)));

  return rotas;
}

module.exports = { rotasMedicos };
