// Controle de "última requisição": quando a pessoa troca de médico rápido, a resposta
// de um pedido antigo pode chegar depois da do pedido novo. Cada pedido recebe um
// número; só a resposta do último número é aplicada na tela.
export function criarControleUltimaRequisicao() {
  let ultima = 0;
  return {
    nova() {
      ultima += 1;
      return ultima;
    },
    ehAtual(numero) {
      return numero === ultima;
    },
    // Descarta o que estiver em andamento (ex.: a tela foi limpa).
    invalidar() {
      ultima += 1;
    },
  };
}
