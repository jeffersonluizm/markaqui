// 404 do app (endereço inexistente no navegador ou link quebrado).
import React from 'react';
import { EstadoVazio } from '../../componentes/Estados';
import { Tela } from '../../componentes/Tela';

export default function NaoEncontrado({ navigation }) {
  return (
    <Tela>
      <EstadoVazio
        icone="map-marker-question-outline"
        titulo="Página não encontrada"
        descricao="O endereço não existe ou mudou de lugar."
        acao="Ir para o início"
        aoAgir={() => navigation.reset({ index: 0, routes: [{ name: navigation.getState().routeNames[0] }] })}
      />
    </Tela>
  );
}
