// Navegação por papel (React Navigation): sem sessão, as telas de conexão; com
// sessão, abas da paciente ou da clínica. Cada papel só monta as próprias telas,
// então não existe caminho para a área do outro.
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-paper';
import { useSessao } from '../contexto/Sessao';
import { cores, fontes } from '../tema/tokens';

import BoasVindas from '../telas/conexao/BoasVindas';
import EscolhaPerfil from '../telas/conexao/EscolhaPerfil';
import Entrar from '../telas/conexao/Entrar';
import Cadastro from '../telas/conexao/Cadastro';
import RecuperarSenha from '../telas/conexao/RecuperarSenha';
import Termos from '../telas/conexao/Termos';

import Inicio from '../telas/paciente/Inicio';
import Profissionais from '../telas/paciente/Profissionais';
import DetalheProfissional from '../telas/paciente/DetalheProfissional';
import ConfirmarAgendamento from '../telas/paciente/ConfirmarAgendamento';
import AgendamentoConcluido from '../telas/paciente/AgendamentoConcluido';

import Painel from '../telas/gestor/Painel';
import Agenda from '../telas/gestor/Agenda';
import NovosHorarios from '../telas/gestor/NovosHorarios';
import Medicos from '../telas/gestor/Medicos';
import MedicoForm from '../telas/gestor/MedicoForm';

import Consultas from '../telas/comum/Consultas';
import DetalheConsulta from '../telas/comum/DetalheConsulta';
import Perfil from '../telas/comum/Perfil';
import TrocarSenha from '../telas/comum/TrocarSenha';
import Sobre from '../telas/comum/Sobre';
import NaoEncontrado from '../telas/comum/NaoEncontrado';

const Pilha = createNativeStackNavigator();
const Abas = createBottomTabNavigator();

const opcoesCabecalho = {
  headerStyle: { backgroundColor: cores.superficie },
  headerTintColor: cores.marinho,
  headerTitleStyle: { fontFamily: fontes.seminegrito, color: cores.marinhoEscuro },
  headerShadowVisible: false,
  headerBackTitle: 'Voltar',
  contentStyle: { backgroundColor: cores.fundo },
};

const opcoesAbas = {
  ...opcoesCabecalho,
  tabBarActiveTintColor: cores.marinho,
  tabBarInactiveTintColor: cores.textoSecundario,
  tabBarLabelStyle: { fontFamily: fontes.media, fontSize: 12 },
  tabBarStyle: { minHeight: 60, paddingTop: 4, borderTopColor: cores.bordaSuave },
};

// Ícone cheio na aba ativa e de contorno nas outras (reforça o estado além da cor).
const icone = (ativo, inativo = `${ativo}-outline`) =>
  function IconeAba({ color, size, focused }) {
    return <Icon source={focused ? ativo : inativo} color={color} size={size} />;
  };

function AbasPaciente() {
  return (
    <Abas.Navigator screenOptions={opcoesAbas}>
      <Abas.Screen name="Inicio" component={Inicio} options={{ title: 'Início', headerShown: false, tabBarIcon: icone('home') }} />
      <Abas.Screen name="Profissionais" component={Profissionais} options={{ title: 'Médicos', tabBarIcon: icone('account-search') }} />
      <Abas.Screen name="Consultas" component={Consultas} options={{ title: 'Consultas', tabBarIcon: icone('calendar-check') }} />
      <Abas.Screen name="Perfil" component={Perfil} options={{ title: 'Perfil', tabBarIcon: icone('account-circle') }} />
    </Abas.Navigator>
  );
}

function AbasGestor() {
  return (
    <Abas.Navigator screenOptions={opcoesAbas}>
      <Abas.Screen name="Painel" component={Painel} options={{ title: 'Painel', headerShown: false, tabBarIcon: icone('view-dashboard') }} />
      <Abas.Screen name="Agenda" component={Agenda} options={{ title: 'Agenda', tabBarIcon: icone('calendar-month') }} />
      <Abas.Screen name="Medicos" component={Medicos} options={{ title: 'Médicos', tabBarIcon: icone('stethoscope', 'stethoscope') }} />
      <Abas.Screen name="Consultas" component={Consultas} options={{ title: 'Consultas', tabBarIcon: icone('calendar-check') }} />
      <Abas.Screen name="Perfil" component={Perfil} options={{ title: 'Perfil', tabBarIcon: icone('account-circle') }} />
    </Abas.Navigator>
  );
}

// Telas que existem para todos os papéis logados.
const telasComuns = (
  <>
    <Pilha.Screen name="DetalheConsulta" component={DetalheConsulta} options={{ title: 'Consulta' }} />
    <Pilha.Screen name="TrocarSenha" component={TrocarSenha} options={{ title: 'Trocar senha' }} />
    <Pilha.Screen name="Sobre" component={Sobre} options={{ title: 'Sobre o Markaqui' }} />
    <Pilha.Screen name="Termos" component={Termos} options={{ title: 'Termos' }} />
    <Pilha.Screen name="NaoEncontrado" component={NaoEncontrado} options={{ title: 'Não encontrado' }} />
  </>
);

export default function Navegacao() {
  const { usuario } = useSessao();

  if (!usuario) {
    return (
      <Pilha.Navigator screenOptions={opcoesCabecalho}>
        <Pilha.Screen name="BoasVindas" component={BoasVindas} options={{ headerShown: false, title: 'Markaqui' }} />
        <Pilha.Screen name="EscolhaPerfil" component={EscolhaPerfil} options={{ title: '', headerStyle: { backgroundColor: cores.gelo } }} />
        <Pilha.Screen name="Entrar" component={Entrar} options={{ title: 'Entrar' }} />
        <Pilha.Screen name="Cadastro" component={Cadastro} options={{ title: 'Criar conta' }} />
        <Pilha.Screen name="RecuperarSenha" component={RecuperarSenha} options={{ title: 'Recuperar senha' }} />
        <Pilha.Screen name="Termos" component={Termos} options={{ title: 'Termos' }} />
        <Pilha.Screen name="Sobre" component={Sobre} options={{ title: 'Sobre o Markaqui' }} />
        <Pilha.Screen name="NaoEncontrado" component={NaoEncontrado} options={{ title: 'Não encontrado' }} />
      </Pilha.Navigator>
    );
  }

  if (usuario.papel === 'gestor') {
    return (
      <Pilha.Navigator screenOptions={opcoesCabecalho}>
        <Pilha.Screen name="Abas" component={AbasGestor} options={{ headerShown: false, title: 'Markaqui' }} />
        <Pilha.Screen name="NovosHorarios" component={NovosHorarios} options={{ title: 'Abrir horários' }} />
        <Pilha.Screen name="MedicoForm" component={MedicoForm} options={{ title: 'Médico' }} />
        {telasComuns}
      </Pilha.Navigator>
    );
  }

  return (
    <Pilha.Navigator screenOptions={opcoesCabecalho}>
      <Pilha.Screen name="Abas" component={AbasPaciente} options={{ headerShown: false, title: 'Markaqui' }} />
      <Pilha.Screen name="DetalheProfissional" component={DetalheProfissional} options={{ title: 'Agenda do médico' }} />
      <Pilha.Screen name="ConfirmarAgendamento" component={ConfirmarAgendamento} options={{ title: 'Confirmar' }} />
      <Pilha.Screen name="AgendamentoConcluido" component={AgendamentoConcluido} options={{ headerShown: false, title: 'Agendado' }} />
      {telasComuns}
    </Pilha.Navigator>
  );
}

// Endereços legíveis no navegador (Expo web) e 404 para o resto.
export const linking = {
  prefixes: ['markaqui://'],
  config: {
    screens: {
      BoasVindas: '',
      EscolhaPerfil: 'perfil',
      Entrar: 'entrar',
      Cadastro: 'cadastro',
      RecuperarSenha: 'recuperar-senha',
      Termos: 'termos',
      Sobre: 'sobre',
      Abas: {
        path: 'app',
        screens: {
          Inicio: 'inicio',
          Profissionais: 'medicos',
          Painel: 'painel',
          Agenda: 'agenda',
          Medicos: 'equipe',
          Consultas: 'consultas',
          Perfil: 'conta',
        },
      },
      DetalheProfissional: 'medicos/:id',
      DetalheConsulta: 'consultas/:id',
      ConfirmarAgendamento: 'confirmar',
      AgendamentoConcluido: 'agendado',
      NovosHorarios: 'horarios/novos',
      MedicoForm: 'equipe/editar',
      TrocarSenha: 'trocar-senha',
      NaoEncontrado: '*',
    },
  },
};
