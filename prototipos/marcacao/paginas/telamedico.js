import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';

import MedicoInfor from '../components/medicoinfor'
import HorarioMarca from '../components/horariomarca'

const TelaMedico = () => {

  return (
    <View style={{flex:1}}>
    <MedicoInfor/>
    <HorarioMarca/>
    </View>
  )
}

export default TelaMedico;