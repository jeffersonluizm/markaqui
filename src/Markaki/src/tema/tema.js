// Tema do React Native Paper (Material Design 3) montado a partir dos tokens.
import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { cores, fontes } from './tokens';

// Cada variante do MD3 com a família Inter do peso certo (no Android, fontWeight
// sozinho não troca de arquivo de fonte).
const familiaPorVariante = {
  displayLarge: fontes.negrito,
  displayMedium: fontes.negrito,
  displaySmall: fontes.negrito,
  headlineLarge: fontes.negrito,
  headlineMedium: fontes.negrito,
  headlineSmall: fontes.seminegrito,
  titleLarge: fontes.seminegrito,
  titleMedium: fontes.seminegrito,
  titleSmall: fontes.media,
  labelLarge: fontes.seminegrito,
  labelMedium: fontes.media,
  labelSmall: fontes.media,
  bodyLarge: fontes.regular,
  bodyMedium: fontes.regular,
  bodySmall: fontes.regular,
  default: fontes.regular,
};

const config = Object.fromEntries(
  Object.entries(familiaPorVariante).map(([variante, fontFamily]) => [variante, { fontFamily, fontWeight: undefined }])
);

export const tema = {
  ...MD3LightTheme,
  roundness: 3,
  fonts: configureFonts({ config }),
  colors: {
    ...MD3LightTheme.colors,
    primary: cores.marinho,
    onPrimary: '#ffffff',
    primaryContainer: cores.gelo,
    onPrimaryContainer: cores.marinhoEscuro,
    secondary: cores.marinhoClaro,
    onSecondary: '#ffffff',
    secondaryContainer: cores.gelo,
    onSecondaryContainer: cores.marinhoEscuro,
    tertiary: cores.marinhoClaro,
    background: cores.fundo,
    onBackground: cores.texto,
    surface: cores.superficie,
    onSurface: cores.texto,
    surfaceVariant: cores.selecionado,
    onSurfaceVariant: cores.textoSecundario,
    outline: cores.borda,
    outlineVariant: cores.bordaSuave,
    error: cores.erro,
    onError: '#ffffff',
    errorContainer: cores.erroFundo,
    onErrorContainer: cores.erro,
    inverseSurface: cores.marinhoEscuro,
    inverseOnSurface: '#ffffff',
    inversePrimary: cores.gelo,
    backdrop: cores.sobreposicao,
    elevation: {
      level0: 'transparent',
      level1: '#ffffff',
      level2: '#f9fcfe',
      level3: cores.selecionado,
      level4: cores.selecionado,
      level5: cores.gelo,
    },
  },
};

// Tema do React Navigation com as mesmas cores (fundo das telas, cabeçalho e abas).
export function temaNavegacao(base) {
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: cores.marinho,
      background: cores.fundo,
      card: cores.superficie,
      text: cores.marinhoEscuro,
      border: cores.bordaSuave,
      notification: cores.erro,
    },
    fonts: {
      regular: { fontFamily: fontes.regular, fontWeight: '400' },
      medium: { fontFamily: fontes.media, fontWeight: '500' },
      bold: { fontFamily: fontes.seminegrito, fontWeight: '600' },
      heavy: { fontFamily: fontes.negrito, fontWeight: '700' },
    },
  };
}
