// Abrir horários: escolhe médico, dia e várias horas de uma vez (sem digitar
// data nem hora). Horários que já existem aparecem desativados.
import React, { useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native-paper';
import { Tela, TituloSecao, TituloTela } from '../../componentes/Tela';
import { ConteudoRemoto } from '../../componentes/Estados';
import { ChipsFiltro, GradeHoras, SeletorDia } from '../../componentes/Seletores';
import { BotaoPrincipal } from '../../componentes/Formulario';
import { useAvisos } from '../../contexto/Avisos';
import { useRecurso } from '../../hooks/useRecurso';
import { api } from '../../servicos/api';
import { gradeDeHoras, proximosDias } from '../../servicos/agenda';
import { dataPorExtenso } from '../../servicos/formatacao';
import { cores } from '../../tema/tokens';

const DIAS = proximosDias(30);
const HORAS = gradeDeHoras({ inicio: '07:00', fim: '19:00', passoMin: 30 });

export default function NovosHorarios({ navigation, route }) {
  const { mostrar } = useAvisos();
  const medicos = useRecurso(() => api.medicos.listar());
  const [medicoId, setMedicoId] = useState(route.params?.medicoId || null);
  const [dia, setDia] = useState(DIAS[0]);
  const [horas, setHoras] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const existentes = useRecurso(() => (medicoId ? api.horarios.listar(medicoId) : Promise.resolve([])), [medicoId]);

  useEffect(() => {
    if (!medicoId && medicos.dados?.length) setMedicoId(medicos.dados[0].id);
  }, [medicos.dados, medicoId]);

  const jaExistem = useMemo(
    () => (existentes.dados || []).filter((h) => h.data === dia).map((h) => h.hora),
    [existentes.dados, dia]
  );

  const alternar = (hora) =>
    setHoras((atual) => (atual.includes(hora) ? atual.filter((h) => h !== hora) : [...atual, hora].sort()));

  async function salvar() {
    setSalvando(true);
    let criados = 0;
    const falhas = [];
    for (const hora of horas) {
      try {
        await api.horarios.cadastrar({ medico_id: medicoId, data: dia, hora });
        criados += 1;
      } catch (erro) {
        falhas.push(`${hora}: ${erro.message}`);
      }
    }
    setSalvando(false);
    if (falhas.length === 0) {
      mostrar(`${criados} horário(s) aberto(s) em ${dataPorExtenso(dia)}.`);
      navigation.goBack();
    } else {
      mostrar(`${criados} aberto(s). Não foi possível abrir ${falhas.join('; ')}`, 'erro');
      setHoras([]);
      existentes.atualizar();
    }
  }

  return (
    <Tela>
      <TituloTela titulo="Abrir horários" subtitulo="Escolha o médico, o dia e quantos horários quiser." />
      <ConteudoRemoto recurso={medicos}>
        {(lista) => (
          <>
            <TituloSecao>Médico</TituloSecao>
            <ChipsFiltro
              rotulo="Médico"
              selecionada={medicoId}
              aoSelecionar={(id) => {
                setMedicoId(id);
                setHoras([]);
              }}
              opcoes={lista.map((m) => ({ valor: m.id, rotulo: m.nome }))}
            />
            <TituloSecao>Dia</TituloSecao>
            <SeletorDia
              dias={DIAS}
              selecionado={dia}
              aoSelecionar={(novo) => {
                setDia(novo);
                setHoras([]);
              }}
            />
            <Text variant="bodyMedium" style={{ color: cores.textoSecundario }}>
              {dataPorExtenso(dia)}
            </Text>
            <TituloSecao>Horas ({horas.length} escolhida(s))</TituloSecao>
            <GradeHoras horas={HORAS} selecionadas={horas} indisponiveis={jaExistem} aoAlternar={alternar} />
            <BotaoPrincipal onPress={salvar} disabled={horas.length === 0 || salvando || !medicoId} loading={salvando}>
              {horas.length ? `Abrir ${horas.length} horário(s)` : 'Escolha as horas'}
            </BotaoPrincipal>
          </>
        )}
      </ConteudoRemoto>
    </Tela>
  );
}
