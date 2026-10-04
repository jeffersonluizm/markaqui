const { requisicaoInvalida } = require('../erros');
const { texto, somenteCampos } = require('./comum');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function email(corpo) {
  const valor = texto(corpo, 'email', { rotulo: 'o e-mail', max: 120 }).toLowerCase();
  if (!EMAIL.test(valor)) throw requisicaoInvalida('Informe um e-mail válido.');
  return valor;
}

// Telefone opcional: guarda só os dígitos (DDD + número, 10 ou 11 dígitos).
function telefone(corpo) {
  if (corpo.telefone === undefined || corpo.telefone === null || corpo.telefone === '') return '';
  if (typeof corpo.telefone !== 'string') throw requisicaoInvalida('O telefone deve ser um texto.');
  const digitos = corpo.telefone.replace(/\D/g, '');
  if (digitos.length < 10 || digitos.length > 11) {
    throw requisicaoInvalida('Informe o telefone com DDD (10 ou 11 dígitos).');
  }
  return digitos;
}

// 8 a 72 caracteres (o bcrypt ignora o que passa de 72 bytes), com letra e número.
function senhaNova(corpo, campo) {
  const valor = corpo[campo];
  if (typeof valor !== 'string' || valor.length < 8 || valor.length > 72) {
    throw requisicaoInvalida('A senha precisa ter de 8 a 72 caracteres.');
  }
  if (!/[A-Za-z]/.test(valor) || !/\d/.test(valor)) {
    throw requisicaoInvalida('A senha precisa ter letras e números.');
  }
  return valor;
}

function validarCadastro(corpo) {
  const dados = {
    nome: texto(corpo, 'nome', { rotulo: 'o nome', min: 3, max: 80 }),
    email: email(corpo),
    telefone: telefone(corpo),
    senha: senhaNova(corpo, 'senha'),
  };
  if (corpo.aceite_termos !== true) {
    throw requisicaoInvalida('É preciso aceitar os termos de uso para criar a conta.');
  }
  return dados;
}

function validarLogin(corpo) {
  if (typeof corpo.email !== 'string' || typeof corpo.senha !== 'string' || !corpo.email || !corpo.senha) {
    throw requisicaoInvalida('Informe e-mail e senha.');
  }
  return { email: corpo.email.trim().toLowerCase(), senha: corpo.senha };
}

function validarPerfil(corpo) {
  somenteCampos(corpo, ['nome', 'telefone']);
  return {
    nome: texto(corpo, 'nome', { rotulo: 'o nome', min: 3, max: 80, opcional: true }),
    telefone: 'telefone' in corpo ? telefone(corpo) : undefined,
  };
}

function validarTrocaDeSenha(corpo) {
  if (typeof corpo.senha_atual !== 'string' || !corpo.senha_atual) {
    throw requisicaoInvalida('Informe a senha atual.');
  }
  return { senhaAtual: corpo.senha_atual, novaSenha: senhaNova(corpo, 'nova_senha') };
}

module.exports = { senhaNova, validarCadastro, validarLogin, validarPerfil, validarTrocaDeSenha };
