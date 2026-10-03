import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';

const MedicoInfor = () => {

  return (
    
    <View style={styles.cardinfo}>
    <Image
    style={styles.foto}
    source={require('../imagens/snack-icon.png')}/>
    <View style={styles.textoinfo}>
    <Text style={styles.nome}>Dr.Fulano da Silva </Text>
    <Text style={styles.crm}>CMR/MG 123456 </Text>
    <Text style={styles.especialidade}>Clinico Geral </Text>
    <Text style={styles.local}>Clínica MarKaki - Unidade MG </Text>
    </View>
    </View>
  )
}

export default MedicoInfor;

const styles = StyleSheet.create({
  cardinfo:{
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 60,
    marginLeft: 5,
  },
  foto:{
    width: 80,
    height: 80,
    marginRight: 10,
  },
  nome:{
    fontSize: 35,
    fontWeight: 'bold',
    color: '#000',
  },
  crm:{
    fontSize: 20,
    fontWeight: 'bold',
  },
   especialidade:{
    fontSize: 20,
    fontWeight: 'bold',
  },
   local:{
    fontSize: 20,
    fontWeight: 'bold',
  },
  
})