// Identidade do Markaqui, tirada dos protótipos e wireframes do próprio projeto
// (prototipos/ e docs/img): marinho, azul-gelo e neutros slate. Todo estilo do
// app usa estes tokens; nenhuma cor solta nas telas.
//
// Contraste (WCAG AA, texto normal >= 4,5:1), conferido em contraste.test.mjs:
//   branco sobre marinho #1e3a56 ........ 11,7:1
//   marinhoEscuro #0D2136 sobre gelo ..... 13,4:1
//   texto #0f172a sobre fundo #f7fbfd .... 17,2:1
//   textoSecundario #475569 sobre branco . 7,6:1
//   textoSuave #64748b sobre branco ...... 4,8:1
//   erro #b91c1c sobre branco ............ 6,5:1
//   sucesso #1f6f3a sobre sucessoFundo ... 5,4:1
//   aviso #92400e sobre avisoFundo ....... 6,4:1
export const cores = {
  marinho: '#1e3a56',
  marinhoEscuro: '#0D2136',
  marinhoClaro: '#2c5480',
  gelo: '#d8ecf5',
  geloForte: '#b9dbea',
  selecionado: '#eef6fb',
  fundo: '#f7fbfd',
  superficie: '#ffffff',
  borda: '#cbd5e1',
  bordaSuave: '#e2e8f0',
  texto: '#0f172a',
  textoSecundario: '#475569',
  textoSuave: '#64748b',
  erro: '#b91c1c',
  erroFundo: '#fde8e8',
  sucesso: '#1f6f3a',
  sucessoFundo: '#e3f3e8',
  aviso: '#92400e',
  avisoFundo: '#fef3c7',
  sobreposicao: 'rgba(13, 33, 54, 0.45)',
};

export const raio = {
  pilula: 30,
  cartao: 18,
  campo: 12,
  chip: 20,
};

export const espaco = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Inter, carregada com @expo-google-fonts/inter no App.js.
export const fontes = {
  regular: 'Inter_400Regular',
  media: 'Inter_500Medium',
  seminegrito: 'Inter_600SemiBold',
  negrito: 'Inter_700Bold',
};

// Alvo de toque mínimo (Material e WCAG 2.5.8).
export const ALVO_MINIMO = 48;
