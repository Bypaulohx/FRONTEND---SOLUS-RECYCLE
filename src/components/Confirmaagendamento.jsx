import React from "react";
import "../App.css";
import React, { useState, useEffect } from 'react';


const Backend_API = {
    COLETAS_AGENDADAS: '/api/agendamentos/usuario', 
    CANCELAR_COLETA: (id) => `/api/agendamentos/cancelar/${id}`, 
};

function Confirmaagendamento() {
    const [coletas, setColetas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        const buscarColetas = async () => {
            try {
                const response = await fetch(Backend_API.COLETAS_AGENDADAS);
                if (!response.ok) {
                    throw new Error("Não foi possível carregar as coletas agendadas.");
                }
                const data = await response.json();
                setColetas(data);
            } catch (error) {
                console.error("Erro ao buscar coletas:", error);
                setErro("Ocorreu um erro ao carregar suas coletas.");
            } finally {
                setIsLoading(false);
            }
        };

        buscarColetas();
    }, []);

    const handleCancelamento = async (coletaId) => {
        if (!window.confirm("Tem certeza que deseja cancelar esta coleta?")) {
            return;
        }

        try {
            const response = await fetch(Backend_API.CANCELAR_COLETA(coletaId), {
                method: 'DELETE',
            });

            if (response.ok) {
                alert("Coleta cancelada com sucesso!");
                setColetas(coletas.filter(coleta => coleta.id !== coletaId));
                window.location.href = 'confirmacao-cancelamento.html';
            } else {
                const errorData = await response.json();
                alert(`Erro ao cancelar: ${errorData.message || 'Tente novamente.'}`);
            }
        } catch (error) {
            console.error("Erro na requisição de cancelamento:", error);
            alert("Ocorreu um erro de rede. Tente novamente mais tarde.");
        }
    };
    
    if (isLoading) {
        return <div>Carregando suas coletas...</div>;
    }

    if (erro) {
        return <div>{erro}</div>;
    }
    
    if (coletas.length === 0) {
        return (
            <div className="container confirmation-container no-collections">
                <a href="agendamento.html" className="back-btn">←</a>
                <h2>Você não possui coletas agendadas.</h2>
                <a href="mapa.html" className="map-btn">Ir para o mapa e agendar uma nova coleta</a>
            </div>
        );
    }
    
    return (
        <div className="container confirmation-container">
        <a href="./Agendamento.jsx" class="back-btn" id="backBtn"><i class="bi bi-chevron-left"></i></a>
            
            <h2>Você possui {coletas.length} coleta{coletas.length > 1 ? 's' : ''} agendada{coletas.length > 1 ? 's' : ''}</h2>
            
            {coletas.map(coleta => (
                <div key={coleta.id} className="collection-card">
                    <h3>{coleta.nomeColetor}</h3>
                    <p>{coleta.data} - {coleta.materiais.join(', ')}</p>
                    <p className="instruction">
                        *Deixe seus resíduos recicláveis prontos para retirada e fique atento ao seu telefone.
                    </p>
                    <div className="action-buttons">
                        <button onClick={() => handleCancelamento(coleta.id)} className="cancel-btn">
                            Cancelar coleta
                        </button>
                        <a href="agendamento.html" className="green-btn">
                            Reagendar
                        </a>
                    </div>
                </div>
            ))}

            <h3 style={{ marginTop: '20px' }}>Acesse o mapa para agendar novas coletas a domicílio</h3>
            <a href="mapa.html" className="map-btn">Ir para o mapa</a>
        </div>
    );
}

export default Confirmaagendamento;