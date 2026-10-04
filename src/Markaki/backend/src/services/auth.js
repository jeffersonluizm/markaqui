// Cadastro de paciente, login, perfil e troca de senha. O hash (bcrypt) é feito
// fora da transação, porque é lento de propósito e não precisa travar o banco.
const bcrypt = require('bcryptjs');
const { gerarId } = require('../infra/ids');
const { emitirToken } = require('../infra/tokens');
const { conflito, naoAutenticado, requisicaoInvalida } = require('../erros');
const { usuarioPublico } = require('./apresentacao');

const MSG_LOGIN = 'E-mail ou senha inválidos.';

function criarServicoAuth(armazenamento, config) {
  // Hash de comparação para e-mail inexistente: o login leva o mesmo tempo com ou
  // sem conta, e o tempo de resposta não revela quem tem cadastro.
  const hashFalso = bcrypt.hashSync('senha-que-nao-existe-1', config.bcryptCusto);
  const sessao = (usuario) => ({
    token: emitirToken(usuario, { segredo: config.jwtSegredo, validade: config.jwtValidade }),
    usuario: usuarioPublico(usuario),
  });

  return {
    // Autocadastro cria sempre paciente. Gestor só pelo script de dados (npm run semear).
    async cadastrar({ nome, email, telefone, senha }) {
      const senha_hash = await bcrypt.hash(senha, config.bcryptCusto);
      const usuario = await armazenamento.escrita((r) => {
        if (r.usuarios.buscarPorEmail(email)) throw conflito('Este e-mail já tem cadastro. Tente entrar.');
        return r.usuarios.inserir({ id: gerarId(), nome, email, telefone, senha_hash, papel: 'paciente' });
      });
      return sessao(usuario);
    },

    async entrar({ email, senha }) {
      const usuario = await armazenamento.leitura((r) => r.usuarios.buscarPorEmail(email));
      const confere = await bcrypt.compare(senha, usuario ? usuario.senha_hash : hashFalso);
      if (!usuario || !confere) throw naoAutenticado(MSG_LOGIN);
      return sessao(usuario);
    },

    async atualizarPerfil(usuarioId, { nome, telefone }) {
      const usuario = await armazenamento.escrita((r) => {
        const atualizado = r.usuarios.atualizar(usuarioId, { nome, telefone });
        if (nome) r.agendamentos.renomearPacienteNosAtivos(usuarioId, nome);
        return atualizado;
      });
      return usuarioPublico(usuario);
    },

    async trocarSenha(usuarioId, { senhaAtual, novaSenha }) {
      const usuario = await armazenamento.leitura((r) => r.usuarios.buscar(usuarioId));
      if (!(await bcrypt.compare(senhaAtual, usuario.senha_hash))) {
        throw requisicaoInvalida('A senha atual não confere.');
      }
      const senha_hash = await bcrypt.hash(novaSenha, config.bcryptCusto);
      await armazenamento.escrita((r) => r.usuarios.atualizar(usuarioId, { senha_hash }));
      return { mensagem: 'Senha alterada.' };
    },
  };
}

module.exports = { criarServicoAuth };
