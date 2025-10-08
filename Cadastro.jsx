import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet
} from 'react-native';

export default function Cadastro() {
  const [etapa, setEtapa] = useState(1);
  const [tipoUsuario, setTipoUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const handleAvancar = () => {
    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }
    setEtapa(2);
  };

  const handleEscolhaTipo = tipo => {
    setTipoUsuario(tipo);
    setEtapa(3);
  };

  const handleCadastroFinal = () => {
    Alert.alert('Cadastro concluído', `Tipo: ${tipoUsuario}`);
    // Aqui você pode enviar os dados para o backend com fetch()
    // e redirecionar para a Home
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {etapa === 1 && (
        <View>
          <Text style={styles.titulo}>Olá! Vamos começar?</Text>
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Telefone" value={telefone} onChangeText={setTelefone} />
          <TextInput style={styles.input} placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />
          <TextInput style={styles.input} placeholder="Confirme a senha" secureTextEntry value={confirmarSenha} onChangeText={setConfirmarSenha} />
          <Button title="Avançar" onPress={handleAvancar} />
        </View>
      )}

      {etapa === 2 && (
        <View>
          <Text style={styles.titulo}>Quem é você?</Text>
          <TouchableOpacity style={styles.botao} onPress={() => handleEscolhaTipo('comunidade')}>
            <Text style={styles.botaoTexto}>Comunidade</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botao} onPress={() => handleEscolhaTipo('organizacao')}>
            <Text style={styles.botaoTexto}>Organização Social</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botao} onPress={() => handleEscolhaTipo('reciclador')}>
            <Text style={styles.botaoTexto}>Usuário Reciclador</Text>
          </TouchableOpacity>
        </View>
      )}

      {etapa === 3 && (
        <View>
          <Text style={styles.titulo}>Finalizando cadastro</Text>
          <TextInput style={styles.input} placeholder="Nome completo ou da organização" />
          <TextInput style={styles.input} placeholder="CPF ou CNPJ" />
          <TextInput style={styles.input} placeholder="CEP" />
          <TextInput style={styles.input} placeholder="Número" />
          <TextInput style={styles.input} placeholder="Complemento" />

          {tipoUsuario !== 'reciclador' && (
            <>
              <TextInput style={styles.input} placeholder="Horários e Dias de Funcionamento" />
              <Text style={styles.subtitulo}>O que recicla:</Text>
              {['Papel', 'Plástico', 'Metal', 'Vidro', 'Eletrônicos'].map(item => (
                <TouchableOpacity key={item} style={styles.checkbox}>
                  <Text>{item}</Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.subtitulo}>Quantidade de Kilos:</Text>
              {['5-10kg', '10-15kg', '15-20kg', 'Acima de 20kg'].map(item => (
                <TouchableOpacity key={item} style={styles.checkbox}>
                  <Text>{item}</Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.subtitulo}>Meio de Coleta:</Text>
              {['Carro', 'Bicicleta', 'Carroça', 'Caminhão', 'Van'].map(item => (
                <TouchableOpacity key={item} style={styles.checkbox}>
                  <Text>{item}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          <TouchableOpacity style={styles.checkbox}>
            <Text>Aceito receber notificações</Text>
          </TouchableOpacity>

          <Button title="Cadastrar" onPress={handleCadastroFinal} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1
  },
  titulo: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold'
  },
  subtitulo: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
    fontWeight: 'bold'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5
  },
  botao: {
    backgroundColor: '#4CAF50',
    padding: 15,
    marginVertical: 10,
    borderRadius: 5
  },
  botaoTexto: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  checkbox: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10
  }
});