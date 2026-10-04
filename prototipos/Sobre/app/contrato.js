import { Feather } from '@expo/vector-icons'; // Para o ícone de fechar
import { useRouter } from 'expo-router';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import content from '../content.json';

export default function ContractModal() {
  const router = useRouter(); // Hook para navegação
  const termsData = content.terms;

  const handleAccept = () => {
    Alert.alert("Termos Aceitos", "Obrigado por aceitar nosso contrato!");
    router.back(); // Fecha o modal
  };

  const handleDecline = () => {
    router.back(); // Apenas fecha o modal
  };

  return (
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.modalView}>
        {/* Botão para fechar o modal no canto */}
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Feather name="x" size={24} color="#0D2136" />
        </TouchableOpacity>

        <Text style={styles.title}>{termsData.title}</Text>
        
        {/* Área de texto do contrato */}
        <View style={styles.contractTextBox}>
          <ScrollView>
            <Text style={styles.contractText}>{termsData.contractText}</Text>
            <Text style={styles.contractText}>{termsData.contractText}</Text>
          </ScrollView>
        </View>

        {/* Botões de Ação */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.buttonAccept} onPress={handleAccept}>
            <Text style={styles.buttonTextAccept}>{termsData.acceptButton}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonDecline} onPress={handleDecline}>
            <Text style={styles.buttonTextDecline}>{termsData.declineButton}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Estilos totalmente novos para o visual de modal
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo escuro semi-transparente
  },
  modalView: {
    margin: 20,
    backgroundColor: '#E0F2F7', // Cor de fundo da tela "Sobre"
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0D2136', // Cor escura do tema
    marginBottom: 20,
  },
  contractTextBox: {
    width: '100%',
    flex: 1, // Faz a área de texto ocupar o espaço disponível
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#B0C4DE',
  },
  contractText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
  },
  buttonAccept: {
    backgroundColor: '#0D2136', // Cor escura do tema
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonTextAccept: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDecline: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0D2136',
  },
  buttonTextDecline: {
    color: '#0D2136', // Cor escura do tema
    fontSize: 16,
    fontWeight: 'bold',
  },
});