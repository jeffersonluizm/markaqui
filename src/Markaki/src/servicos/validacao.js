// Validação dos formulários no app, com as mesmas regras da API (backend/src/
// validators). Mostra o erro ao lado do campo antes de ir ao servidor; a API
// continua sendo quem decide. Cada função devolve { campo: mensagem }.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const semErros = (erros) => Object.keys(erros).length === 0;

function tamanho(valor, min, max, rotulo) {
  const limpo = (valor || '').trim();
  if (!limpo) return `Informe ${rotulo}.`;
  if (limpo.length < min) return `${rotulo[0].toUpperCase()}${rotulo.slice(1)} precisa de pelo menos ${min} caracteres.`;
  if (limpo.length > max) return `Use no máximo ${max} caracteres.`;
  return undefined;
}

export function validarEmail(email) {
  if (!(email || '').trim()) return 'Informe o e-mail.';
  if (!EMAIL.test(email.trim())) return 'Informe um e-mail válido.';
  return undefined;
}

export function validarTelefone(telefone) {
  const digitos = (telefone || '').replace(/\D/g, '');
  if (digitos && (digitos.length < 10 || digitos.length > 11)) return 'Informe o telefone com DDD (10 ou 11 dígitos).';
  return undefined;
}

export function validarNovaSenha(senha) {
  if (!senha || senha.length < 8 || senha.length > 72) return 'A senha precisa ter de 8 a 72 caracteres.';
  if (!/[A-Za-z]/.test(senha) || !/\d/.test(senha)) return 'A senha precisa ter letras e números.';
  return undefined;
}

function limpar(erros) {
  return Object.fromEntries(Object.entries(erros).filter(([, mensagem]) => mensagem));
}

export function validarCadastro({ nome, email, telefone, senha, confirmacao, aceite }) {
  return limpar({
    nome: tamanho(nome, 3, 80, 'o nome'),
    email: validarEmail(email),
    telefone: validarTelefone(telefone),
    senha: validarNovaSenha(senha),
    confirmacao: senha !== confirmacao ? 'As senhas não conferem.' : undefined,
    aceite: aceite ? undefined : 'Para criar a conta, aceite os termos de uso.',
  });
}

export function validarEntrada({ email, senha }) {
  return limpar({
    email: validarEmail(email),
    senha: senha ? undefined : 'Informe a senha.',
  });
}

export function validarTrocaDeSenha({ atual, nova, confirmacao }) {
  return limpar({
    atual: atual ? undefined : 'Informe a senha atual.',
    nova: validarNovaSenha(nova),
    confirmacao: nova !== confirmacao ? 'As senhas não conferem.' : undefined,
  });
}

export function validarPerfil({ nome, telefone }) {
  return limpar({ nome: tamanho(nome, 3, 80, 'o nome'), telefone: validarTelefone(telefone) });
}

export function validarMedico({ nome, especialidade }) {
  return limpar({
    nome: tamanho(nome, 3, 80, 'o nome'),
    especialidade: tamanho(especialidade, 3, 60, 'a especialidade'),
  });
}
