// Monta a aplicação Express sobre um armazenamento (injeção de dependência: os
// testes e a carga escolhem o arquivo de dados).
const express = require('express');
const cors = require('cors');
const { rotasMedicos } = require('./routes/medicos');
const { rotasHorarios } = require('./routes/horarios');
const { rotasAgendamentos } = require('./routes/agendamentos');
const { tratarErros } = require('./middlewares/erros');

function criarApp({ armazenamento }) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/medicos', rotasMedicos(armazenamento));
  app.use('/api/horarios', rotasHorarios(armazenamento));
  app.use('/api/agendamentos', rotasAgendamentos(armazenamento));

  app.use(tratarErros);
  return app;
}

module.exports = { criarApp };
