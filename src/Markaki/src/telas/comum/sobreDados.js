// Números da página Sobre (atualizados a partir de docs/carga e das suítes de teste).
export const TESTES =
  'Testes automatizados: API (node:test + supertest, banco SQLite temporário) cobrindo login, papéis, agenda, concorrência e cancelamento; app (node:test) cobrindo cliente HTTP, validações, formatação, agenda e contraste de cores.';

export const CARGA =
  'Teste de carga (autocannon) com hipóteses escritas antes de medir. Com 10.000 horários, trocar o arquivo JSON por SQLite levou a leitura de 141 para 1.266 requisições/s e a escrita de 61 para 5.863 por segundo; sob concorrência, nenhum agendamento duplicado nas duas versões. Detalhes em docs/carga.';
