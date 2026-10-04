// Hospedagem gratuita "dorme" a API sem uso; a primeira requisição leva de 30 a 60 s.
// Antes de qualquer coisa o app confere a saúde da API e, se ela demorar, mostra
// "acordando o servidor de demonstração" em vez de um erro.
const pausaPadrao = (ms) => new Promise((r) => setTimeout(r, ms));

export async function aguardarServidor({
  verificar,
  aoDemorar = () => {},
  esperar = pausaPadrao,
  tentativas = 9,
  intervaloMs = 3000,
}) {
  let avisou = false;
  let ultimoErro;
  for (let i = 0; i < tentativas; i++) {
    try {
      return await verificar();
    } catch (erro) {
      // Só falta de conexão ou demora indica servidor dormindo; outros erros sobem já.
      if (!erro.conexao) throw erro;
      ultimoErro = erro;
      if (!avisou) {
        avisou = true;
        aoDemorar();
      }
      await esperar(intervaloMs);
    }
  }
  throw ultimoErro;
}
