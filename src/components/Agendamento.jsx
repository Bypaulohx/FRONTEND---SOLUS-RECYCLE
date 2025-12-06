import React from "react";
import "../App.css";
import React, { useState, useEffect } from 'react';
const DownArrow = () => <i className="bi bi-caret-down-fill" style={{ marginLeft: '5px' }}></i>;

const Backend_API = {
    DADOS_COLETOR: '/api/dados-coletor',
    AGENDAR_COLETA: '/api/agendar-coleta',
    ENDERECO_USUARIO: '/api/user/endereco_uruario'
};

function Agendamento() {
    const [dadosColetor, setDadosColetor] = useState({
        nome: '',
        materiaisAceitos: [],
        pesosAceitos: [],
        regraPeso: ''
    });
    
    const [agendamento, setAgendamento] = useState({
        dataColeta: '', 
        materiaisSelecionados: [],
        pesoSelecionado: '',
        observacao: ''
    });

    const [isLoading, setIsLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [enderecoUsuario, setEnderecoUsuario] = useState(null);

    useEffect(() => {
        const buscarDadosIniciais = async () => {
            try {
                const responseColetor = await fetch(Backend_API.DADOS_COLETOR);
                if (!responseColetor.ok) throw new Error("Falha ao carregar dados do coletor.");
                const dados = await responseColetor.json();

                setDadosColetor({
                    nome: dados.nome,
                    materiaisAceitos: dados.materiaisAceitos || [],
                    pesosAceitos: dados.pesosAceitos || [],
                    regraPeso: dados.regraPeso || ''
                });

                const responseEndereco = await fetch('/api/user/address');
                if (!responseEndereco.ok) throw new Error("Falha ao carregar endereço do usuário.");
                const endereco = await responseEndereco.json();
                setEnderecoUsuario(endereco); 

            } catch (error) {
                console.error("Erro ao carregar dados iniciais:", error);
                setErro("Não foi possível carregar os dados necessários para o agendamento.");
            } finally {
                setIsLoading(false);
            }
        };

        buscarDadosIniciais();
    }, []);
    
    const handleChange = (event) => {
        const { name, value, options } = event.target;
        
        if (name === 'materiaisSelecionados') {
            const selectedOptions = Array.from(options).filter(option => option.selected).map(option => option.value);
            setAgendamento(prev => ({ ...prev, [name]: selectedOptions }));
        } else {
            setAgendamento(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSelecionarDia = (data) => {
        setAgendamento(prev => ({ ...prev, dataColeta: data }));
    };

    const handleAgendarColeta = async (event) => {
        event.preventDefault(); 

        if (!agendamento.dataColeta || agendamento.materiaisSelecionados.length === 0 || !agendamento.pesoSelecionado || !enderecoUsuario) {
            alert("Por favor, preencha todos os campos obrigatórios e garanta que seu endereço esteja cadastrado.");
            return;
        }
        
        const dadosParaBackend = {
            dataColeta: agendamento.dataColeta,
            materiais: agendamento.materiaisSelecionados,
            pesoAproximado: agendamento.pesoSelecionado,
            observacao: agendamento.observacao,
            enderecoColeta: enderecoUsuario,
            nomeColetor: dadosColetor.nome,
        };

        try {
            const response = await fetch(Backend_API.AGENDAR_COLETA, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosParaBackend),
            });
            
            if (response.ok) {
                alert("Agendamento realizado com sucesso!");
                window.location.href = 'confirmacao-agendamento.html'; 
            } else {
                const errorData = await response.json();
                alert(`Erro ao agendar: ${errorData.message || 'Tente novamente.'}`);
            }
            
        } catch (error) {
            console.error("Erro na submissão:", error);
            alert("Ocorreu um erro de rede. Verifique sua conexão.");
        }
    };

    if (isLoading) return <div>Carregando dados da empresa e do usuário...</div>;
    if (erro) return <div>Erro: {erro}</div>;
    if (!enderecoUsuario) return <div>Erro: Seu endereço não está cadastrado. Por favor, complete seu cadastro.</div>;


    return (
        <div className="container agendamento-container">
            
            <div className="boxed-section">
                <h2>{dadosColetor.nome || 'Empresa Coletora'}</h2>
            </div>
            
            <div className="boxed-section">
                
                <p>Quando será sua coleta?</p>
                <div className="calendar">
                    <div className="calendar-header">
                        <i className="bi bi-chevron-compact-left"></i> 
                        <span id="monthYear">Selecione o Dia</span> 
                        <i className="bi bi-chevron-compact-right"></i>
                    </div>
                    <input 
                        type="date" 
                        value={agendamento.dataColeta} 
                        onChange={(e) => handleSelecionarDia(e.target.value)}
                        style={{ width: '100%', padding: '10px', marginTop: '10px' }}
                    />
                </div>

                <p>Quais materiais serão coletados?</p>
                <p>Essa empresa só realiza coletas de: <strong>{dadosColetor.materiaisAceitos.join(' e/ou ') || 'Carregando...'}</strong></p>
                
                <div style={{ position: 'relative' }}>
                    <select 
                        className="custom-select" 
                        name="materiaisSelecionados"
                        value={agendamento.materiaisSelecionados}
                        onChange={handleChange}
                        multiple={true}
                    >
                        {dadosColetor.materiaisAceitos.map(material => (
                            <option key={material} value={material}>{material}</option>
                        ))}
                    </select>
                    <span style={{ position: 'absolute', top: '10px', left: '10px', pointerEvents: 'none' }}>
                        Selecione uma ou mais opções <DownArrow/>
                    </span>
                </div>

                <p>Qual o peso aproximado da sua separação?</p>
                <p><strong>{dadosColetor.regraPeso}</strong></p>
                
                <div style={{ position: 'relative' }}>
                    <select 
                        className="custom-select" 
                        name="pesoSelecionado"
                        value={agendamento.pesoSelecionado}
                        onChange={handleChange}
                    >
                         <option value="" disabled>Selecione uma <DownArrow/></option>
                        
                        {dadosColetor.pesosAceitos.map(peso => (
                            <option key={peso} value={peso}>{peso}</option>
                        ))}
                    </select>
                </div>
                
                <p>Tem alguma observação?</p>
                <textarea 
                    name="observacao"
                    value={agendamento.observacao}
                    onChange={handleChange}
                    placeholder="Comente sobre seus itens, horários para recebimento, etc.."
                ></textarea>

                <button onClick={handleAgendarColeta} className="green-btn" type="button" disabled={!agendamento.dataColeta}>
                    Agendar coleta
                </button>
            </div>
        </div>
    );
}

export default Agendamento;