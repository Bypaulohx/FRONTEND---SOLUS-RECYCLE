import React from "react";
import "../App.css";

import React, { useState, useEffect } from 'react';

const Backend_API = {
    DETALHES_COLETOR: (id) => `/api/coletor/${id}`,
};

function Detalhesponto() {
    const coletorId = 'buscar no backend';

    const [coletor, setColetor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        const buscarDetalhesColetor = async () => {
            try {
                const response = await fetch(Backend_API.DETALHES_COLETOR(coletorId));
                if (!response.ok) {
                    throw new Error("Não foi possível carregar os detalhes do coletor.");
                }
                const data = await response.json();
                setColetor(data);
            } catch (error) {
                console.error("Erro ao buscar detalhes:", error);
                setErro("Ocorreu um erro ao carregar os dados. Por favor, tente novamente.");
            } finally {
                setIsLoading(false);
            }
        };

        if (coletorId) {
            buscarDetalhesColetor();
        } else {
            setErro("ID do coletor não encontrado.");
            setIsLoading(false);
        }
    }, [coletorId]);

    if (isLoading) {
        return <div className="loading-container">Carregando detalhes do coletor...</div>;
    }

    if (erro) {
        return <div className="error-container">{erro}</div>;
    }

    if (!coletor) {
        return <div className="not-found-container">Detalhes do coletor não disponíveis.</div>;
    }

    return (
        <div className="container details-container">
            <a href="encontrar-catadores.html" className="back-btn" id="backBtn">
                <i className="bi bi-arrow-left-circle-fill"></i>
            </a>

            <div className="gallery">
                {coletor.imagens && coletor.imagens.length > 0 ? (
                    coletor.imagens.map((imagem, index) => (
                        <img 
                            key={index} 
                            src={imagem.url}
                            alt={imagem.descricao || `Imagem ${index + 1}`} 
                            className="gallery-img"
                        />
                    ))
                ) : (
                    <div className="no-images">Nenhuma imagem disponível.</div>
                )}
            </div>

            <h2>{coletor.nome}</h2>

            <p className="address">{coletor.endereco}</p>
            <p>Aberto de {coletor.horarioFuncionamento}</p>
            <p>{coletor.telefone}</p>

            <p className="domicile-collection">
                {coletor.realizaColetaDomicilio ? "Realiza coletas a domicílio" : "Não realiza coletas a domicílio"}
            </p>

            <p className="material-info">
                {coletor.materiaisAceitos} a partir de {coletor.pesoMinimo}
            </p>

            <div className="action-buttons">
                <a href={`./Agendamento.jsx${coletorId}`} className="green-btn">
                    Agendar coleta
                </a>
                <a href={`tel:${coletor.telefone.replace(/\s/g, '').replace(/\D/g, '')}`} className="call-btn">
                    Ligar
                </a>
            </div>
        </div>
    );
}

export default Detalhesponto;