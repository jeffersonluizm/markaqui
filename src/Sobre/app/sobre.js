import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router'; 
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import content from '../content.json';


const AppHeader = () => (
  <View style={styles.header}>
    <Text style={styles.headerBrand}>Markaqui</Text>
    <View style={styles.headerNav}>
      <TouchableOpacity onPress={() => console.log("Início Pressionado")}>
        <Text style={styles.headerLink}>Início</Text>
      </TouchableOpacity>
      <Text style={[styles.headerLink, styles.activeLink]}>Sobre</Text>
      <Link href="/contrato" asChild>
        <TouchableOpacity>
          <Text style={styles.headerLink}>Contrato</Text>
        </TouchableOpacity>
      </Link>
    </View>
  </View>
);

const InfoCard = ({ iconName, title, text, values }) => (
    <View style={styles.card}>
        <View style={styles.cardIcon}><Feather name={iconName} size={28} color="#0D2136" /></View>
        <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{title}</Text>
            {text && <Text style={styles.cardText}>{text}</Text>}
            {values && values.map(value => <Text key={value} style={styles.cardListItem}>• {value}</Text>)}
        </View>
    </View>
);

export default function AboutScreen() {
  const aboutData = content.about;
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <AppHeader />
        <View style={styles.mainContent}>
          <Text style={styles.title}>{aboutData.title}</Text>
          <Text style={styles.subtitle}>{aboutData.subtitle}</Text>
          
          <InfoCard iconName="users" title={aboutData.mission.title} text={aboutData.mission.text} />
          <InfoCard iconName="search" title={aboutData.vision.title} text={aboutData.vision.text} />
          <InfoCard iconName="shield" title={aboutData.values.title} values={aboutData.values.items} />
          
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => console.log("Botão 'Comece a agendar' pressionado")}
          >
            <Text style={styles.ctaButtonText}>{aboutData.ctaButton}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E0F2F7' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerBrand: { fontSize: 22, fontWeight: 'bold', color: '#0D2136' },
  headerNav: { flexDirection: 'row', gap: 15 },
  headerLink: { fontSize: 16, color: '#0D2136' },
  activeLink: { fontWeight: 'bold' },
  mainContent: { padding: 25 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#0D2136' },
  subtitle: { fontSize: 18, textAlign: 'center', color: '#555', marginBottom: 40 },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardIcon: { marginRight: 15 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#0D2136', marginBottom: 5 },
  cardText: { fontSize: 16, color: '#333', lineHeight: 22 },
  cardListItem: { fontSize: 16, color: '#333', lineHeight: 22 },
  ctaButton: {
    backgroundColor: '#0D2136',
    borderRadius: 25,
    paddingVertical: 15,
    marginTop: 20,
    alignItems: 'center',
  },
  ctaButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});