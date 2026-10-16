// Carrega dados da API com os três estados (carregando, erro, dados), recarrega
// quando a tela volta a ficar em foco e descarta respostas velhas (ex.: a pessoa
// troca de filtro antes da resposta anterior chegar).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { criarControleUltimaRequisicao } from '../servicos/requisicoes';

export function useRecurso(carregar, dependencias = []) {
  const [estado, setEstado] = useState({ dados: null, carregando: true, erro: null, atualizando: false });
  const controle = useRef(criarControleUltimaRequisicao());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const carregarAtual = useCallback(carregar, dependencias);

  const executar = useCallback(
    async ({ silencioso = false } = {}) => {
      const pedido = controle.current.nova();
      // Primeira carga (ou depois de um erro) mostra "carregando". Com dados na
      // tela, a volta à tela atualiza sem indicador e o "puxar para atualizar"
      // mostra o indicador dele.
      setEstado((atual) => ({
        ...atual,
        carregando: atual.dados === null,
        atualizando: !silencioso && atual.dados !== null,
        erro: atual.dados === null ? null : atual.erro,
      }));
      try {
        const dados = await carregarAtual();
        if (controle.current.ehAtual(pedido)) setEstado({ dados, carregando: false, erro: null, atualizando: false });
      } catch (erro) {
        if (controle.current.ehAtual(pedido)) {
          setEstado((atual) => ({ ...atual, carregando: false, atualizando: false, erro }));
        }
      }
    },
    [carregarAtual]
  );

  // Mudou o que carregar (ex.: outro médico): não mostra os dados do anterior.
  const primeiraVez = useRef(true);
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false;
      return;
    }
    setEstado({ dados: null, carregando: true, erro: null, atualizando: false });
  }, [carregarAtual]);

  useFocusEffect(
    useCallback(() => {
      executar({ silencioso: true });
      return () => controle.current.invalidar();
    }, [executar])
  );

  return {
    ...estado,
    recarregar: () => executar(),
    atualizar: () => executar({ silencioso: true }),
  };
}
