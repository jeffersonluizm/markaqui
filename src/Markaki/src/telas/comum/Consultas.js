// Consultas: a paciente vê as próprias; a clínica vê todas (com o nome da
// paciente). Próximas e histórico separados.
import React, { useState } from 'react';
import { SegmentedButtons } from 'react-native-paper';
import { Tela } from '../../componentes/Tela';
import { CartaoConsulta } from '../../componentes/Cartoes';
import { ConteudoRemoto, EstadoVazio } from '../../componentes/Estados';
import { useSessao } from '../../contexto/Sessao';
import { useRecurso } from '../../hooks/useRecurso';
import { api } from '../../servicos/api';
import { separarConsultas } from '../../servicos/agenda';

export default function Consultas({ navigation }) {
  const { usuario } = useSessao();
  const daClinica = usuario.papel === 'gestor';
  const recurso = useRecurso(() => api.agendamentos.listar());
  const [aba, setAba] = useState('proximas');

  return (
    <Tela atualizando={recurso.atualizando} aoAtualizar={recurso.recarregar}>
      <SegmentedButtons
        value={aba}
        onValueChange={setAba}
        buttons={[
          { value: 'proximas', label: 'Próximas', icon: 'calendar-clock' },
          { value: 'historico', label: 'Histórico', icon: 'history' },
        ]}
      />
      <ConteudoRemoto recurso={recurso} mensagemCarregando="Buscando consultas...">
        {(consultas) => {
          const { proximas, historico } = separarConsultas(consultas);
          const lista = aba === 'proximas' ? proximas : historico;
          if (lista.length === 0) {
            return aba === 'proximas' ? (
              <EstadoVazio
                icone="calendar-blank-outline"
                titulo="Nenhuma consulta marcada"
                descricao={daClinica ? 'Quando um paciente agendar, a consulta aparece aqui.' : 'Escolha um médico e um horário livre para agendar.'}
                acao={daClinica ? undefined : 'Agendar consulta'}
                aoAgir={() => navigation.navigate('Profissionais')}
              />
            ) : (
              <EstadoVazio icone="history" titulo="Histórico vazio" descricao="Consultas canceladas e realizadas aparecem aqui." />
            );
          }
          return lista.map((consulta) => (
            <CartaoConsulta
              key={consulta.id}
              consulta={consulta}
              mostrarPaciente={daClinica}
              aoTocar={() => navigation.navigate('DetalheConsulta', { id: consulta.id })}
            />
          ));
        }}
      </ConteudoRemoto>
    </Tela>
  );
}
