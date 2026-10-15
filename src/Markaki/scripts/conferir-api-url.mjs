// Roda antes do build de publicação (vercel.json): sem EXPO_PUBLIC_API_URL válida,
// para o build com uma mensagem clara em vez de publicar um app que procura a API
// em http://localhost:3000. O desenvolvimento local (expo start) não passa por aqui.
import { problemaNaApiUrlDePublicacao } from '../src/servicos/http.js';

const problema = problemaNaApiUrlDePublicacao(process.env.EXPO_PUBLIC_API_URL);
if (problema) {
  console.error(`[build] ${problema}`);
  console.error(
    '[build] Na Vercel: Settings > Environment Variables > EXPO_PUBLIC_API_URL = https://SUA-API.onrender.com/api (ver docs/deploy.md).'
  );
  process.exit(1);
}
console.log(`[build] API do app publicado: ${process.env.EXPO_PUBLIC_API_URL.trim()}`);
