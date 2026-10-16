const express = require('express');
const medicos = require('../services/medicos');
const { validarNovoMedico, validarEdicaoMedico } = require('../validators/medico');
const { criarManipuladores } = require('../middlewares/erros');
const { exigirPapel } = require('../middlewares/autenticacao');

function rotasMedicos(armazenamento, config) {
  const { ler, gravar } = criarManipuladores(armazenamento, config);
  const gestor = exigirPapel('gestor');
  const rotas = express.Router();

  rotas.get(
    '/',
    ler('Erro ao buscar médicos.', (r, ctx) => r.medicos.listar(ctx.config.limiteListagem))
  );
  rotas.get(
    '/:id',
    ler('Erro ao buscar médico.', (r, ctx) => medicos.buscar(r, ctx.params.id))
  );
  rotas.post(
    '/',
    gestor,
    gravar('Erro ao cadastrar médico.', (r, dados, ctx) => medicos.cadastrar(r, dados, ctx), {
      status: 201,
      validar: validarNovoMedico,
    })
  );
  rotas.put(
    '/:id',
    gestor,
    gravar('Erro ao atualizar médico.', (r, dados, ctx) => medicos.atualizar(r, ctx.params.id, dados, ctx), {
      validar: validarEdicaoMedico,
    })
  );
  rotas.delete(
    '/:id',
    gestor,
    gravar('Erro ao remover médico.', (r, _, ctx) => medicos.remover(r, ctx.params.id, ctx))
  );

  return rotas;
}

module.exports = { rotasMedicos };
