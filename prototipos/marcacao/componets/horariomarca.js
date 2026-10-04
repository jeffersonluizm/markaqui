import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { Calendar, LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ],
  monthNamesShort: [
    'Jan.',
    'Fev.',
    'Mai',
    'Mar.',
    'Abr.',
    'Jun.',
    'Jul.',
    'Ago.',
    'Set.',
    'Out.',
    'Nov.',
    'Dez.',
  ],
  dayNames: [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado',
  ],
  dayNamesShort: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
  today: 'Hoje',
};
LocaleConfig.defaultLocale = 'pt-br';

const HorarioMarca = () => {
  const [diaSelecionado, setDiaSelecionado] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const API_URL = 'https://transiently-campanological-harlan.ngrok-free.dev';

  const cuidaAgendamento = (idDoHorarioClicado) => {
    setHorarios((horariosAtuais) => {
      return horariosAtuais.map((horario) => {
        if (horario.id === idDoHorarioClicado) {
          return { ...horario, disponivel: false };
        }
        return horario;
      });
    });
  };
  const confirmarAgendamento = (item) => {
    Alert.alert(
      'Confirmar Agendamento?',
      `Você tem certeza de que deseja confirmar o agendamento pra este horário? \n \n ${item.hora}`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            cuidaAgendamento(item.id);
            try {
              const url = `${API_URL}/horarios/${item.id}`;
              const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  disponivel: false,
                }),
              });
              if (!response.ok) {
                throw new Error('Falha ao salvar no servidor');
              }

              console.log('Agendamento salvo no back-end com sucesso!');
            } catch (error) {
              console.error('Erro ao salvar agendamento:', error);
              Alert.alert(
                'Erro',
                'Não foi possível salvar seu agendamento. Tente novamente.'
              );
            }
          },
        },
      ]
    );
  };

  const mostraHorario = ({ item }) => {
    return (
      <View
        style={[styles.itemCard, !item.disponivel && styles.itemIndisponivel]}>
        {item.disponivel ? (
          <TouchableOpacity
            style={styles.botaoAgendar}
            onPress={() => confirmarAgendamento(item)}>
            <Text style={styles.itemHora}>{item.hora}</Text>
            <Text style={styles.botaoAgendarText}>Agendar</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.statusOcupado}>
            O horário de {item.hora} já está agendado.
          </Text>
        )}
      </View>
    );
  };

  const aoSelecionarDia = async (dia) => {
    const dataSelecionada = dia.dateString;
    console.log('Buscando horários para:', dataSelecionada);

    setDiaSelecionado(dataSelecionada);
    setCarregando(true);
    setHorarios([]);

    try {
      const response = await fetch(
        `${API_URL}/horarios?data=${dataSelecionada}`
      );

      const dados = await response.json();

      setHorarios(dados);
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      Alert.alert(
        'Erro',
        'Não foi possível carregar os horários. Tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      {!diaSelecionado ? (
        <>
          <Text style={styles.textoCalend}>
            Selecione um dia no calendário para ver se tem horário disponível.
          </Text>
          <Calendar
            style={styles.calendarContainer}
            onDayPress={aoSelecionarDia}
            markedDates={{
              [diaSelecionado]: { selected: true, selectedColor: '#172D46' },
            }}
            theme={{
              flex: 1,
              todayTextColor: 'blue',
              monthTextColor: '#FFF',
              arrowColor: '#FFF',
              calendarBackground: '#172D46',
              textSectionTitleColor: '#FFF',
              dayTextColor: '#FFF',
              textDayFontSize: 20,
              textMonthFontSize: 20,
              textDayHeaderFontSize: 13,
            }}
          />
        </>
      ) : (
        <>
          <TouchableOpacity onPress={() => setDiaSelecionado('')}>
            <Text style={styles.titulo}>Horários para {diaSelecionado} 🗓</Text>
            <Text style={styles.tituloclicavel}>
              (Clique aqui para alterar o dia)
            </Text>
          </TouchableOpacity>
          <View style={styles.cardContainer}>
            <FlatList
              data={horarios}
              renderItem={mostraHorario}
              keyExtractor={(item) => item.id}
            />
          </View>
        </>
      )}
    </View>
  );
};

export default HorarioMarca;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DFF8F8',
    padding: 15,
  },
  calendarContainer: {
    borderRadius: 20,
    padding: 15,
  },
  titulo: {
    marginTop: 20,
    fontSize: 25,
    fontWeight: 'bold',
    color: '##DFF8F8',
  },
  tituloclicavel: {
    marginBottom: 15,
    fontWeight: 'bold',
  },
  textoCalend: {
    fontSize: 27,
    textAlign: 'center',
    color: '#',
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
  },
  itemCard: {
    backgroundColor: '#172D46',
    padding: 20,
    marginVertical: 8,
    borderRadius: 16,
    elevation: 2,
    marginHorizontal: 32,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
  },
  itemIndisponivel: {
    backgroundColor: '#373737',
  },
  itemHora: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFF',
    marginRight: 7,
  },
  botaoAgendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  botaoAgendarText: {
    fontSize: 30,
    color: '#479F38',
    fontWeight: 'bold',
  },
  statusOcupado: {
    fontSize: 17,
    color: '#BA3722',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
