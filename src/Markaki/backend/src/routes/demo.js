// Modo demonstração (sem login). Com DEMO_ENABLED desligado, as rotas não existem.
const express = require('express');
const { entrarNaDemonstracao } = require('../services/demonstracao');
const { criarManipuladores } = require('../middlewares/erros');
const { requisicaoInvalida } = require('../erros');

const PAPEIS = ['paciente', 'gestor'];

function validarEntrada(corpo = {}) {
  if (!PAPEIS.includes(corpo.papel)) throw requisicaoInvalida('Escolha entrar como paciente ou como clínica.');
  return corpo.papel;
}

// limiteDemo: "Entrar como" por IP por minuto (cada entrada de paciente cria uma conta).
function rotasDemo(armazenamento, config, { limiteDemo }) {
  const { executar } = criarManipuladores(armazenamento, config);
  const rotas = express.Router();

  rotas.use((req, res, next) => {
    if (!config.demo?.ativo) return res.status(404).json({ erro: 'Rota não encontrada.' });
    return next();
  });
  // Só os papéis e os nomes: não há senha nem e-mail para publicar.
  rotas.get('/', (req, res) => {
    const contas = PAPEIS.map((papel) => ({ papel, nome: config.demo.contas[papel].nome }));
    res.json({ contas });
  });
  rotas.post(
    '/entrar',
    limiteDemo,
    executar('Erro ao entrar na demonstração.', 200, (req) =>
      entrarNaDemonstracao(armazenamento, config, validarEntrada(req.body))
    )
  );
  return rotas;
}

module.exports = { rotasDemo };
