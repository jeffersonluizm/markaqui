import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* Define as telas principais sem cabeçalho padrão */}
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="sobre" 
        options={{ headerShown: false }} 
      />

      {/* Adicionamos esta configuração específica para a tela de contrato */}
      <Stack.Screen
        name="contrato"
        options={{
          // Isso faz com que a tela surja de baixo para cima como um modal
          presentation: 'modal', 
          // Esconde o cabeçalho padrão do modal
          headerShown: false, 
        }}
      />
    </Stack>
  );
}