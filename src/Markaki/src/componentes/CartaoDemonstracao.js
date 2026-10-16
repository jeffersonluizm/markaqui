// "Explore a demonstração": com o modo demonstração ligado na API (GET /api/demo),
// entra como paciente ou como clínica com um toque, sem senha (POST
// /api/demo/entrar). Cada entrada de paciente ganha uma conta própria. Com o modo
// desligado (404), o cartão simplesmente não aparece.
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';
import { api } from '../servicos/api';
import { entrarNaDemonstracao as entrarComNovaTentativa } from '../servicos/demonstracao';
import { useSessao } from '../contexto/Sessao';
import { cores, espaco, fontes, raio, ALVO_MINIMO } from '../tema/tokens';

const ROTULO = { paciente: 'Entrar como paciente', gestor: 'Entrar como clínica' };
const ICONE = { paciente: 'account-heart-outline', gestor: 'hospital-building' };

export function CartaoDemonstracao({ escuro = false }) {
  const { entrarNaDemonstracao } = useSessao();
  const [contas, setContas] = useState(null);
  const [entrando, setEntrando] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let ativo = true;
    api.demo
      .contas()
      .then((r) => ativo && setContas(r.contas))
      .catch(() => ativo && setContas([]));
    return () => {
      ativo = false;
    };
  }, []);

  if (!contas || contas.length === 0) return null;

  async function entrarComo(conta) {
    setEntrando(conta.papel);
    setErro(null);
    try {
      const recarregar = async () => {
        const { contas: novas } = await api.demo.contas();
        setContas(novas);
        return novas;
      };
      const sessao = await entrarComNovaTentativa(conta.papel, { entrar: api.demo.entrar, recarregar });
      await entrarNaDemonstracao(sessao);
    } catch (e) {
      setErro(e.message);
      setEntrando(null);
    }
  }

  const ordem = (c) => (c.papel === 'paciente' ? 0 : 1);
  const ordenadas = [...contas].sort((a, b) => ordem(a) - ordem(b));
  return (
    <View style={[estilos.cartao, escuro && estilos.cartaoEscuro]}>
      <View style={estilos.cabecalho}>
        <Icon source="play-circle-outline" size={26} color={cores.marinho} />
        <Text style={estilos.titulo} accessibilityRole="header">
          Explore a demonstração
        </Text>
      </View>
      <Text variant="bodyMedium" style={estilos.texto}>
        Entre sem cadastro nem senha. Como paciente, você ganha uma conta de exemplo só sua. Os dados são fictícios e
        voltam ao original de tempos em tempos.
      </Text>
      {ordenadas.map((conta) => (
        <Button
          key={conta.papel}
          mode={conta.papel === 'paciente' ? 'contained' : 'outlined'}
          icon={ICONE[conta.papel]}
          onPress={() => entrarComo(conta)}
          loading={entrando === conta.papel}
          disabled={Boolean(entrando)}
          style={estilos.botao}
          contentStyle={estilos.conteudoBotao}
          accessibilityHint={`Entra na conta de demonstração ${conta.nome}`}
        >
          {ROTULO[conta.papel] || conta.nome}
        </Button>
      ))}
      {erro ? (
        <Text style={estilos.erro} accessibilityRole="alert">
          {erro}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.cartao,
    borderWidth: 2,
    borderColor: cores.marinho,
    padding: espaco.md,
    gap: espaco.sm,
  },
  cartaoEscuro: { borderColor: cores.marinhoEscuro },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs },
  titulo: { fontFamily: fontes.negrito, fontSize: 18, color: cores.marinhoEscuro },
  texto: { color: cores.textoSecundario },
  botao: { borderRadius: raio.pilula },
  conteudoBotao: { minHeight: ALVO_MINIMO + 4 },
  erro: { color: cores.erro },
});
