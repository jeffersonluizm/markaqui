// Onde o token da sessão fica guardado entre aberturas do app: no celular, no
// armazenamento seguro do sistema (Keychain / Keystore, via expo-secure-store);
// no navegador, que não tem esse cofre, no localStorage (limitação documentada).
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const CHAVE = 'markaqui.token';

const web = {
  async ler() {
    try {
      return globalThis.localStorage?.getItem(CHAVE) ?? null;
    } catch {
      return null;
    }
  },
  async gravar(token) {
    try {
      globalThis.localStorage?.setItem(CHAVE, token);
    } catch {
      // Navegador sem armazenamento (aba privada): a sessão vale só nesta aba.
    }
  },
  async apagar() {
    try {
      globalThis.localStorage?.removeItem(CHAVE);
    } catch {
      // nada a apagar
    }
  },
};

const nativo = {
  ler: () => SecureStore.getItemAsync(CHAVE),
  gravar: (token) => SecureStore.setItemAsync(CHAVE, token),
  apagar: () => SecureStore.deleteItemAsync(CHAVE),
};

export const guardaToken = Platform.OS === 'web' ? web : nativo;
