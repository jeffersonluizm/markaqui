import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

import AppbarMk from '../components/appbar'
import TelaMedico from './telamedico'

const HomePage = () => {

  return (
    <View style={styles.container}>
    <AppbarMk/>
    <TelaMedico/>
    </View>
  )
}

export default HomePage;

const styles = StyleSheet.create({
   container: {
     flex: 1,
    backgroundColor: '#DFF8F8',
  },
})
