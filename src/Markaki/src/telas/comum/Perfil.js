// Perfil (wireframe "Perfil"): dados, edição, troca de senha, sobre e sair.
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { List, Text } from 'react-native-paper';
import { Tela } from '../../componentes/Tela';
import { AvatarIniciais } from '../../componentes/Cartoes';
import { Campo, BotaoPrincipal, BotaoTexto, BotaoSecundario } from '../../componentes/Formulario';
import { useSessao } from '../../contexto/Sessao';
import { useAvisos } from '../../contexto/Avisos';
import { api } from '../../servicos/api';
import { telefoneFormatado } from '../../servicos/formatacao';
import { validarPerfil, semErros } from '../../servicos/validacao';
import { cores, espaco, raio } from '../../tema/tokens';

export default function Perfil({ navigation }) {
  const { usuario, atualizarUsuario, sair } = useSessao();
  const { mostrar, confirmar } = useAvisos();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ nome: usuario.nome, telefone: usuario.telefone });
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    const encontrados = validarPerfil(form);
    setErros(encontrados);
    if (!semErros(encontrados)) return;
    setSalvando(true);
    try {
      const atualizado = await api.auth.atualizarPerfil({ nome: form.nome.trim(), telefone: form.telefone });
      atualizarUsuario(atualizado);
      setEditando(false);
      mostrar('Dados atualizados.');
    } catch (erro) {
      mostrar(erro.message, 'erro');
    } finally {
      setSalvando(false);
    }
  }

  async function pedirSaida() {
    const ok = await confirmar({ titulo: 'Sair da conta?', mensagem: 'Você precisará entrar de novo para ver suas consultas.', confirmar: 'Sair' });
    if (ok) sair();
  }

  return (
    <Tela>
      <View style={estilos.cabecalho}>
        <AvatarIniciais nome={usuario.nome} tamanho={72} />
        <Text variant="titleLarge" style={estilos.nome} accessibilityRole="header">
          {usuario.nome}
        </Text>
        <Text variant="bodyMedium" style={estilos.secundario}>
          {usuario.papel === 'gestor' ? 'Conta da clínica' : 'Paciente'}
        </Text>
      </View>

      {editando ? (
        <View style={estilos.cartao}>
          <Campo rotulo="Nome completo" value={form.nome} onChangeText={(nome) => setForm({ ...form, nome })} erro={erros.nome} />
          <Campo
            rotulo="Celular com DDD"
            value={form.telefone}
            onChangeText={(telefone) => setForm({ ...form, telefone })}
            erro={erros.telefone}
            keyboardType="phone-pad"
          />
          <BotaoPrincipal onPress={salvar} loading={salvando} disabled={salvando}>
            Salvar
          </BotaoPrincipal>
          <BotaoTexto
            onPress={() => {
              setEditando(false);
              setErros({});
              setForm({ nome: usuario.nome, telefone: usuario.telefone });
            }}
          >
            Cancelar edição
          </BotaoTexto>
        </View>
      ) : (
        <View style={estilos.cartao}>
          <List.Item title="E-mail" description={usuario.email} left={(p) => <List.Icon {...p} icon="email-outline" color={cores.marinho} />} />
          <List.Item
            title="Celular"
            description={usuario.telefone ? telefoneFormatado(usuario.telefone) : 'Não informado'}
            left={(p) => <List.Icon {...p} icon="phone-outline" color={cores.marinho} />}
          />
          {usuario.demo ? (
            <Text variant="bodySmall" style={estilos.secundario}>
              Conta de demonstração: dados e senha não podem ser alterados.
            </Text>
          ) : (
            <BotaoSecundario icon="pencil-outline" onPress={() => setEditando(true)}>
              Editar dados
            </BotaoSecundario>
          )}
        </View>
      )}

      <View style={estilos.cartao}>
        {usuario.demo ? null : (
        <List.Item
          title="Trocar senha"
          left={(p) => <List.Icon {...p} icon="lock-reset" color={cores.marinho} />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => navigation.navigate('TrocarSenha')}
          accessibilityRole="button"
          style={estilos.item}
        />
        )}
        <List.Item
          title="Sobre o Markaqui"
          description="Como o app foi feito"
          left={(p) => <List.Icon {...p} icon="information-outline" color={cores.marinho} />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => navigation.navigate('Sobre')}
          accessibilityRole="button"
          style={estilos.item}
        />
        <List.Item
          title="Termos e privacidade"
          left={(p) => <List.Icon {...p} icon="file-document-outline" color={cores.marinho} />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => navigation.navigate('Termos')}
          accessibilityRole="button"
          style={estilos.item}
        />
      </View>

      <BotaoSecundario icon="logout" onPress={pedirSaida} textColor={cores.erro} style={estilos.sair}>
        Sair
      </BotaoSecundario>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { alignItems: 'center', gap: espaco.xxs, paddingVertical: espaco.md, backgroundColor: cores.gelo, borderRadius: raio.cartao },
  nome: { color: cores.marinhoEscuro },
  secundario: { color: cores.textoSecundario },
  cartao: { backgroundColor: cores.superficie, borderRadius: raio.cartao, borderWidth: 1, borderColor: cores.bordaSuave, padding: espaco.sm, gap: espaco.xs },
  item: { minHeight: 56 },
  sair: { borderColor: cores.erro },
});
