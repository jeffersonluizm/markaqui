// Monta a aplicação Express sobre um armazenamento e uma configuração (injeção de
// dependência: testes e carga escolhem banco, relógio e limites).
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { rotasAuth } = require('./routes/auth');
const { rotasDemo } = require('./routes/demo');
const { rotasMedicos } = require('./routes/medicos');
const { rotasHorarios } = require('./routes/horarios');
const { rotasAgendamentos, rotasPainel } = require('./routes/agendamentos');
const { autenticar } = require('./middlewares/autenticacao');
const { tratarErros } = require('./middlewares/erros');

function limitador(max, mensagem) {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ erro: mensagem }),
  });
}

function criarApp({ armazenamento, config }) {
  const app = express();
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);
  app.use(helmet());
  // Só navegadores mandam Origin; o app nativo e o curl não passam por CORS.
  app.use(cors({ origin: (origem, ok) => ok(null, !origem || config.corsOrigens.includes(origem)) }));
  if (config.limiteGlobalMax > 0) {
    app.use('/api', limitador(config.limiteGlobalMax, 'Muitas requisições. Aguarde um minuto.'));
  }
  app.use(express.json({ limit: '10kb' }));

  const exigeLogin = autenticar(armazenamento, config);
  const limiteAuth = limitador(config.limiteAuthMax, 'Muitas tentativas. Aguarde um minuto e tente de novo.');

  app.get('/api/saude', (req, res) => res.json({ status: 'ok' }));
  const limiteDemo = limitador(
    config.demo?.entradasPorMinuto || 10,
    'Muitas entradas na demonstração. Aguarde um minuto e tente de novo.'
  );
  app.use('/api/demo', rotasDemo(armazenamento, config, { limiteDemo }));
  app.use('/api/auth', rotasAuth(armazenamento, config, { limiteAuth, autenticar: exigeLogin }));
  app.use('/api/medicos', exigeLogin, rotasMedicos(armazenamento, config));
  app.use('/api/horarios', exigeLogin, rotasHorarios(armazenamento, config));
  app.use('/api/agendamentos', exigeLogin, rotasAgendamentos(armazenamento, config));
  app.use('/api/painel', exigeLogin, rotasPainel(armazenamento, config));
  app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

  app.use(tratarErros);
  return app;
}

module.exports = { criarApp };
