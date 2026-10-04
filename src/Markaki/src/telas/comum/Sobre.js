// "Sobre / Como foi feito": o que é, para quem, arquitetura real, decisões,
// testes, carga, limitações e equipe. Acessível antes e depois do login.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { Tela, TituloSecao, TituloTela } from '../../componentes/Tela';
import { Logo } from '../../componentes/Logo';
import { cores, espaco, fontes, raio } from '../../tema/tokens';
import { CARGA, TESTES } from './sobreDados';

function Paragrafo({ children }) {
  return (
    <Text variant="bodyMedium" style={estilos.paragrafo}>
      {children}
    </Text>
  );
}

function Topicos({ itens }) {
  return (
    <View style={estilos.topicos}>
      {itens.map((item) => (
        <View key={item} style={estilos.topico}>
          <Icon source="circle-small" size={20} color={cores.marinho} />
          <Text variant="bodyMedium" style={estilos.textoTopico}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Caixa({ titulo, detalhe, icone }) {
  return (
    <View style={estilos.caixa}>
      <Icon source={icone} size={22} color={cores.marinho} />
      <View style={estilos.expande}>
        <Text variant="titleSmall" style={estilos.tituloCaixa}>
          {titulo}
        </Text>
        <Text variant="bodySmall" style={estilos.textoCaixa}>
          {detalhe}
        </Text>
      </View>
    </View>
  );
}

const Seta = ({ rotulo }) => (
  <View style={estilos.seta} aria-hidden>
    <Icon source="arrow-down" size={20} color={cores.textoSuave} />
    <Text variant="labelSmall" style={estilos.textoSeta}>
      {rotulo}
    </Text>
  </View>
);

export default function Sobre() {
  return (
    <Tela>
      <Logo tamanho={40} />
      <TituloTela
        titulo="Sobre o Markaqui"
        subtitulo="Agendamento de consultas para uma clínica médica: a paciente marca e acompanha; a clínica administra médicos e agenda."
      />

      <TituloSecao>Para quem</TituloSecao>
      <Topicos
        itens={[
          'Paciente: cria a conta, vê só horários livres e futuros, agenda, acompanha e cancela.',
          'Clínica (gestor): cadastra e edita médicos, monta a agenda, bloqueia horários e vê todas as consultas.',
        ]}
      />

      <TituloSecao>Arquitetura</TituloSecao>
      <View
        style={estilos.diagrama}
        accessible
        accessibilityLabel="Diagrama: app Expo chama a API Express por HTTP com token; a API passa por middlewares, rotas, serviços e repositórios até o banco SQLite."
      >
        <Caixa
          icone="cellphone"
          titulo="App (Expo + React Native Paper)"
          detalhe="React Navigation por papel, token no armazenamento seguro"
        />
        <Seta rotulo="HTTP + JSON, token Bearer" />
        <Caixa
          icone="shield-lock-outline"
          titulo="Middlewares"
          detalhe="helmet, CORS por lista, limite de 10 KB, 5 logins/min, autenticação e papel"
        />
        <Seta rotulo="" />
        <Caixa
          icone="routes"
          titulo="Rotas e validações"
          detalhe="Express Router; validators recusam o que não é do formato"
        />
        <Seta rotulo="" />
        <Caixa
          icone="cog-outline"
          titulo="Serviços (regras)"
          detalhe="agenda por médico, nada no passado, cancelamento com histórico"
        />
        <Seta rotulo="transação" />
        <Caixa
          icone="database-outline"
          titulo="Repositórios + SQLite"
          detalhe="better-sqlite3, WAL, UNIQUE de um agendamento ativo por horário"
        />
      </View>

      <TituloSecao>Decisões técnicas</TituloSecao>
      <Topicos
        itens={[
          'Domínio de clínica médica (a proposta original era agendamento B2B genérico).',
          'Arquivo JSON trocado por SQLite: transações no lugar da fila global de escrita; medido antes e depois.',
          'O papel vem do banco a cada requisição; o cadastro pelo app só cria paciente.',
          'Cancelamento lógico: a consulta fica no histórico com data e quem cancelou.',
          'Dados copiados no agendamento (médico, data, hora) para o histórico continuar legível.',
          'Sem fotos de terceiros: avatar com iniciais; logo e ícones próprios gerados por script.',
        ]}
      />

      <TituloSecao>Qualidade</TituloSecao>
      <Paragrafo>{TESTES}</Paragrafo>
      <Paragrafo>{CARGA}</Paragrafo>

      <TituloSecao>Limitações conhecidas</TituloSecao>
      <Topicos
        itens={[
          'Sem envio de e-mail ou notificação push: recuperar senha depende da administração.',
          'Uma clínica só (sem várias unidades) e um único processo de API (SQLite local).',
          'No navegador o token fica no localStorage; no celular, no armazenamento seguro do sistema.',
          'Horários com duração fixa; sem encaixe nem lista de espera.',
        ]}
      />

      <TituloSecao>Equipe</TituloSecao>
      <Paragrafo>
        Projeto do 3º semestre de Análise e Desenvolvimento de Sistemas (PUC Minas): Jefferson Luiz Mendonça da Silva,
        Levi Alves de Oliveira Neto, Bruno Pereira Figueiredo, Kauã Eduardo Silva, William Leal Rocha Viana e Welder
        Fernandes de Morais. Orientação: Will Ricardo dos Santos Machado.
      </Paragrafo>
      <Paragrafo>
        Versão 2.0 (portfólio): mantida por Jefferson Luiz, autor do protótipo das telas institucionais, com login,
        papéis, SQLite, nova identidade e testes de carga.
      </Paragrafo>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  paragrafo: { color: cores.textoSecundario, lineHeight: 22 },
  topicos: { gap: 4 },
  topico: { flexDirection: 'row', alignItems: 'flex-start' },
  textoTopico: { flex: 1, color: cores.textoSecundario, lineHeight: 22 },
  diagrama: { backgroundColor: cores.gelo, borderRadius: raio.cartao, padding: espaco.md, gap: 2 },
  caixa: {
    flexDirection: 'row',
    gap: espaco.sm,
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderRadius: 12,
    padding: espaco.sm,
    borderWidth: 1,
    borderColor: cores.geloForte,
  },
  expande: { flex: 1 },
  tituloCaixa: { color: cores.marinhoEscuro, fontFamily: fontes.seminegrito },
  textoCaixa: { color: cores.textoSecundario },
  seta: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: espaco.md },
  textoSeta: { color: cores.textoSecundario },
});
