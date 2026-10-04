const crypto = require('crypto');
const path = require('path');

const caminhoBanco = (env = process.env) =>
  env.DB_FILE || path.join(__dirname, '..', 'dados', 'markaqui.db');

// Senha forte aleatória (letras e números), usada quando o .env não define uma.
const senhaAleatoria = () => `${crypto.randomBytes(15).toString('base64url')}a7`;

// Modo demonstração: desligado por padrão. Ligado (DEMO_ENABLED=true), cria uma
// paciente e um gestor de demonstração, com senhas do .env ou geradas na partida,
// e expõe GET /api/demo para o app mostrar "Entrar como...". Nenhuma senha fica
// no código.
function lerDemo(env) {
  const conta = (papel, nome, emailPadrao) => {
    const prefixo = `DEMO_${papel.toUpperCase()}`;
    return { papel, nome, email: (env[`${prefixo}_EMAIL`] || emailPadrao).toLowerCase(), senha: env[`${prefixo}_SENHA`] || senhaAleatoria() };
  };
  return {
    ativo: env.DEMO_ENABLED === 'true',
    // Minutos entre os resets dos dados (0 = só na partida).
    resetMinutos: Number(env.DEMO_RESET_MINUTOS) || 0,
    contas: {
      paciente: conta('paciente', 'Marina Albuquerque', 'paciente@markaqui.demo'),
      gestor: conta('gestor', 'Gestão Clínica Markaqui', 'gestor@markaqui.demo'),
    },
  };
}

// Configuração lida do ambiente (arquivo .env ao lado do server.js; modelo em
// .env.example). Sem JWT_SECRET forte a API não sobe.
function lerConfig(env = process.env) {
  const segredo = env.JWT_SECRET || '';
  if (segredo.length < 32) {
    throw new Error(
      'Defina JWT_SECRET com pelo menos 32 caracteres no arquivo .env do backend ' +
        '(veja .env.example; o iniciar.bat cria um automaticamente).'
    );
  }
  const numero = (valor, padrao) => (valor === undefined || valor === '' ? padrao : Number(valor));
  return {
    porta: numero(env.PORT, 3000),
    // Só a própria máquina por padrão. Para o celular na mesma rede, HOST=0.0.0.0
    // (o iniciar.bat faz isso), sabendo que a API fica visível para a rede local.
    host: env.HOST || '127.0.0.1',
    arquivoBanco: caminhoBanco(env),
    jwtSegredo: segredo,
    jwtValidade: env.JWT_VALIDADE || '8h',
    bcryptCusto: numero(env.BCRYPT_CUSTO, 10),
    corsOrigens: (env.CORS_ORIGENS || 'http://localhost:8081,http://localhost:19006')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    // Tentativas de login/cadastro por IP por minuto; e requisições por IP por minuto (0 desliga).
    limiteAuthMax: numero(env.LIMITE_AUTH_POR_MINUTO, 5),
    limiteGlobalMax: numero(env.LIMITE_GLOBAL_POR_MINUTO, 300),
    // Consultas futuras ativas por paciente (uma conta não reserva a agenda toda).
    limiteConsultasAtivas: numero(env.LIMITE_CONSULTAS_ATIVAS, 3),
    // Proxies na frente da API (1 no Render): o limite por IP passa a usar o IP do visitante.
    trustProxy: numero(env.TRUST_PROXY, 0),
    demo: lerDemo(env),
    relogio: () => new Date(),
  };
}

module.exports = { lerConfig, caminhoBanco };
