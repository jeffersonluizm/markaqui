import * as React from 'react';
import {StyleSheet, View, Image } from 'react-native';
import { Appbar,} from 'react-native-paper';

const AppbarMk = () => {

  return (
    <View>
    <Appbar.Header style={styles.appbar}>
    <Image
    source={require('../imagens/snack-icon.png')}
    style={styles.logo}
    />
     <Appbar.Content style={styles.title} title="MarKaki"/>
    </Appbar.Header>
    </View>
  );
};

export default AppbarMk;

const styles = StyleSheet.create({
  appbar:{
    backgroundColor: '#DFF0F8',
    borderRadius: 30,
  },
  title:{
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold'
  },
  logo:{
    width: 42,
    height: 42,
  }
}
)