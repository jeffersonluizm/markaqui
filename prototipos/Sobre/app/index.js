import { Redirect } from 'expo-router';

export default function Index() {
  // Redireciona o usuário da rota raiz ("/") para a tela "/sobre"
  return <Redirect href="/sobre" />;
}