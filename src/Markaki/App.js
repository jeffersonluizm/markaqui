import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import ListaMedicos from './screens/ListaMedicos';
import GerenciarHorarios from './screens/GerenciarHorarios';
import AgendarConsulta from './screens/AgendarConsulta';
import MeusAgendamentos from './screens/MeusAgendamentos';

export default function App() {
  const [telaAtiva, setTelaAtiva] = useState('medicos');

  const renderTela = () => {
    switch (telaAtiva) {
      case 'medicos':
        return <ListaMedicos />;
      case 'horarios':
        return <GerenciarHorarios />;
      case 'agendar':
        return <AgendarConsulta />;
      case 'agendamentos':
        return <MeusAgendamentos />;
      default:
        return <ListaMedicos />;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Sistema de Agendamentos" />
        </Appbar.Header>

        <View style={styles.tabContainer}>
          <Appbar style={styles.tabs}>
            <Appbar.Action
              icon="doctor"
              onPress={() => setTelaAtiva('medicos')}
              color={telaAtiva === 'medicos' ? '#007bff' : '#666'}
            />
            <Appbar.Action
              icon="clock-outline"
              onPress={() => setTelaAtiva('horarios')}
              color={telaAtiva === 'horarios' ? '#007bff' : '#666'}
            />
            <Appbar.Action
              icon="calendar-plus"
              onPress={() => setTelaAtiva('agendar')}
              color={telaAtiva === 'agendar' ? '#007bff' : '#666'}
            />
            <Appbar.Action
              icon="calendar-check"
              onPress={() => setTelaAtiva('agendamentos')}
              color={telaAtiva === 'agendamentos' ? '#007bff' : '#666'}
            />
          </Appbar>
        </View>

        <View style={styles.content}>
          {renderTela()}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    backgroundColor: '#fff',
    elevation: 4,
  },
  tabs: {
    backgroundColor: '#fff',
    justifyContent: 'space-around',
  },
  content: {
    flex: 1,
  },
});
