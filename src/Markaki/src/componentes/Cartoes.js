// Cartões reutilizados nas listas: médico, consulta, situação e número do painel.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar, Icon, Text } from 'react-native-paper';
import { iniciais, dataPorExtenso, SITUACOES } from '../servicos/formatacao';
import { cores, espaco, fontes, raio, ALVO_MINIMO } from '../tema/tokens';

// Foto de terceiros fica de fora: o avatar é sempre com as iniciais.
export function AvatarIniciais({ nome, tamanho = 48 }) {
  return (
    <Avatar.Text
      size={tamanho}
      label={iniciais(nome)}
      style={{ backgroundColor: cores.gelo }}
      color={cores.marinhoEscuro}
      labelStyle={{ fontFamily: fontes.seminegrito }}
      aria-hidden
    />
  );
}

export function Cartao({ children, aoTocar, rotulo, estilo, dica }) {
  const conteudo = <View style={[estilos.cartao, estilo]}>{children}</View>;
  if (!aoTocar) return conteudo;
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityHint={dica}
      style={({ pressed }) => [pressed && estilos.pressionado]}
    >
      {conteudo}
    </Pressable>
  );
}

export function CartaoMedico({ medico, aoTocar, direita }) {
  return (
    <Cartao aoTocar={aoTocar} rotulo={`${medico.nome}, ${medico.especialidade}`} dica="Abre a agenda do médico">
      <View style={estilos.linha}>
        <AvatarIniciais nome={medico.nome} />
        <View style={estilos.expande}>
          <Text variant="titleMedium" style={estilos.titulo}>
            {medico.nome}
          </Text>
          <Text variant="bodyMedium" style={estilos.secundario}>
            {medico.especialidade}
          </Text>
        </View>
        {direita ?? (aoTocar ? <Icon source="chevron-right" size={24} color={cores.textoSuave} /> : null)}
      </View>
    </Cartao>
  );
}

export function ChipSituacao({ situacao }) {
  const { rotulo, icone } = SITUACOES[situacao] || SITUACOES.agendado;
  const estilo = {
    agendado: [estilos.chipAgendado, cores.marinho],
    realizado: [estilos.chipRealizado, cores.sucesso],
    cancelado: [estilos.chipCancelado, cores.erro],
  }[situacao] || [estilos.chipAgendado, cores.marinho];
  return (
    <View style={[estilos.chip, estilo[0]]}>
      <Icon source={icone} size={16} color={estilo[1]} />
      <Text variant="labelMedium" style={{ color: estilo[1] }}>
        {rotulo}
      </Text>
    </View>
  );
}

// `mostrarPaciente` para a visão da clínica.
export function CartaoConsulta({ consulta, aoTocar, mostrarPaciente = false }) {
  const quem = mostrarPaciente ? consulta.paciente_nome : consulta.medico_nome;
  const detalhe = mostrarPaciente
    ? `${consulta.medico_nome} · ${consulta.medico_especialidade}`
    : consulta.medico_especialidade;
  return (
    <Cartao
      aoTocar={aoTocar}
      rotulo={`Consulta ${SITUACOES[consulta.situacao]?.rotulo.toLowerCase()}: ${quem}, ${dataPorExtenso(consulta.data)} às ${consulta.hora}`}
      dica="Abre os detalhes da consulta"
    >
      <View style={estilos.linha}>
        <View style={estilos.data}>
          <Text style={estilos.dataHora}>{consulta.hora}</Text>
          <Text variant="labelSmall" style={estilos.dataDia}>
            {consulta.data.slice(8, 10)}/{consulta.data.slice(5, 7)}
          </Text>
        </View>
        <View style={estilos.expande}>
          <Text variant="titleMedium" style={estilos.titulo} numberOfLines={1}>
            {quem}
          </Text>
          <Text variant="bodySmall" style={estilos.secundario} numberOfLines={1}>
            {detalhe}
          </Text>
          <Text variant="bodySmall" style={estilos.secundario}>
            {dataPorExtenso(consulta.data)}
          </Text>
          <View style={estilos.chipLinha}>
            <ChipSituacao situacao={consulta.situacao} />
          </View>
        </View>
        {aoTocar ? <Icon source="chevron-right" size={24} color={cores.textoSuave} /> : null}
      </View>
    </Cartao>
  );
}

export function Estatistica({ icone, valor, rotulo }) {
  return (
    <View style={[estilos.cartao, estilos.estatistica]} accessible accessibilityLabel={`${valor} ${rotulo}`}>
      <Icon source={icone} size={24} color={cores.marinho} />
      <Text style={estilos.valor}>{valor}</Text>
      <Text variant="bodySmall" style={estilos.secundario}>
        {rotulo}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.cartao,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    padding: espaco.md,
    minHeight: ALVO_MINIMO,
  },
  pressionado: { opacity: 0.85 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  expande: { flex: 1, gap: 2 },
  titulo: { color: cores.marinhoEscuro },
  secundario: { color: cores.textoSecundario },
  chipLinha: { flexDirection: 'row', marginTop: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: raio.chip,
  },
  chipAgendado: { backgroundColor: cores.gelo },
  chipRealizado: { backgroundColor: cores.sucessoFundo },
  chipCancelado: { backgroundColor: cores.erroFundo },
  data: {
    width: 64,
    paddingVertical: espaco.xs,
    borderRadius: 12,
    backgroundColor: cores.selecionado,
    alignItems: 'center',
  },
  dataHora: { fontFamily: fontes.negrito, fontSize: 17, color: cores.marinho },
  dataDia: { color: cores.textoSecundario },
  estatistica: { flex: 1, minWidth: 140, gap: 4 },
  valor: { fontFamily: fontes.negrito, fontSize: 28, color: cores.marinhoEscuro },
});
