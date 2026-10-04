// Armazenamento em arquivo JSON. Toda escrita lê o arquivo, aplica a regra e grava
// de novo, dentro de uma fila global: sem ela, duas requisições simultâneas liam a
// mesma versão e a última gravação apagava a outra (ou dois pacientes ficavam com o
// mesmo horário). A fila só anda quando a operação termina (não quando a resposta
// fecha: se o cliente desiste, a operação continua entre ler e gravar).
const fs = require('fs').promises;
const crypto = require('crypto');
const { criarRepositorios } = require('./repositorios');

function criarArmazenamentoJson(arquivo) {
  let fila = Promise.resolve();
  const comTrava = (fn) => (fila = fila.then(fn, fn));

  // Só a falta do arquivo vale como base vazia. JSON inválido é erro (a rota
  // responde 500) para que a próxima gravação não apague os dados existentes.
  async function lerDados() {
    let conteudo;
    try {
      conteudo = await fs.readFile(arquivo, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { medicos: [], horarios: [], agendamentos: [] };
      }
      throw error;
    }
    return JSON.parse(conteudo);
  }

  // Grava num arquivo temporário e troca pelo definitivo com rename: se o processo
  // cair no meio da gravação, o arquivo antigo continua inteiro.
  async function salvarDados(dados) {
    const temporario = `${arquivo}.${process.pid}.${crypto.randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporario, JSON.stringify(dados, null, 2), 'utf8');
      await fs.rename(temporario, arquivo);
    } catch (error) {
      await fs.rm(temporario, { force: true });
      throw error;
    }
  }

  return {
    async leitura(operacao) {
      return operacao(criarRepositorios(await lerDados()));
    },
    // A operação recebe os repositórios; se lançar erro, nada é gravado.
    escrita(operacao) {
      return comTrava(async () => {
        const dados = await lerDados();
        const resultado = operacao(criarRepositorios(dados));
        await salvarDados(dados);
        return resultado;
      });
    },
  };
}

module.exports = { criarArmazenamentoJson };
