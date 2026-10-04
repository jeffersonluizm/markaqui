const express = require('express');
const { criarServicoAuth } = require('../services/auth');
const { validarCadastro, validarLogin, validarPerfil, validarTrocaDeSenha } = require('../validators/auth');
const { criarManipuladores } = require('../middlewares/erros');

// limiteAuth: limitador de tentativas (login e cadastro); autenticar: exige token.
function rotasAuth(armazenamento, config, { limiteAuth, autenticar }) {
  const auth = criarServicoAuth(armazenamento, config);
  const { executar } = criarManipuladores(armazenamento, config);
  const rotas = express.Router();

  rotas.post(
    '/cadastro',
    limiteAuth,
    executar('Erro ao criar a conta.', 201, (req) => auth.cadastrar(validarCadastro(req.body)))
  );
  rotas.post(
    '/login',
    limiteAuth,
    executar('Erro ao entrar.', 200, (req) => auth.entrar(validarLogin(req.body)))
  );
  rotas.get(
    '/eu',
    autenticar,
    executar('Erro ao buscar o perfil.', 200, async (req) => req.usuario)
  );
  rotas.put(
    '/eu',
    autenticar,
    executar('Erro ao salvar o perfil.', 200, (req) => auth.atualizarPerfil(req.usuario.id, validarPerfil(req.body)))
  );
  rotas.put(
    '/senha',
    limiteAuth,
    autenticar,
    executar('Erro ao trocar a senha.', 200, (req) => auth.trocarSenha(req.usuario.id, validarTrocaDeSenha(req.body)))
  );

  return rotas;
}

module.exports = { rotasAuth };
