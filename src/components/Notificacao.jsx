import React, { useState, useEffect } from 'react';
import { BiArrowBack, BiBell, BiCheckSquare, BiSquare } from 'react-icons/bi';

const Backend_API = 'Backend_API';

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken') || 'token';
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, 
    };
};

const defaultPreferences = {
    coletasMunicipais: true,
    coletasAgendadas: true,
    atualizacoesPlataforma: true,
    avisosGerais: true,
};


const Notificacoes = () => {
    const [preferences, setPreferences] = useState(defaultPreferences);
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const response = await fetch(Backend_API, {
                    method: 'GET',
                    headers: getAuthHeaders(),
                });

                if (!response.ok) {
                    throw new Error('Falha ao carregar preferências de notificação.');
                }
                const data = await response.json();

                setPreferences({
                    coletasMunicipais: data.municipalReminders || false,
                    coletasAgendadas: data.scheduledReminders || false,
                    atualizacoesPlataforma: data.platformUpdates || false,
                    avisosGerais: data.generalAlerts || false,
                });
                
            } catch (err) {
                console.error("Erro ao buscar dados:", err);
                setStatusMessage('Erro ao carregar preferências.');
            } finally {
                setLoading(false);
            }
        };

        fetchPreferences();
    }, []);
    
    const updateBackend = async (newPreferences) => {
        setStatusMessage('Salvando preferências...');

        const payload = {
            municipalReminders: newPreferences.coletasMunicipais,
            scheduledReminders: newPreferences.coletasAgendadas,
            platformUpdates: newPreferences.atualizacoesPlataforma,
            generalAlerts: newPreferences.avisosGerais,
        };
        
        try {
            const response = await fetch(Backend_API, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido.' }));
                throw new Error(errorData.message || `Erro ${response.status} ao salvar.`);
            }

            setStatusMessage('Preferências salvas com sucesso!');

        } catch (err) {
            console.error("Erro ao atualizar dados:", err);
            setStatusMessage(`Erro ao salvar: ${err.message}`);
        }
    };

    const handleToggle = (field) => {
        setPreferences(prev => {
            const newPreferences = {
                ...prev,
                [field]: !prev[field]
            };

            updateBackend(newPreferences);

            return newPreferences;
        });
    };
    
    if (loading) {
        return <div className="loading-state">Carregando configurações...</div>;
    }


    return (
        <>
            <header className="header">
                <a href="/home">
                  <img src="Logo Header.png" className="logo-icon" alt="Logo GreenBox" />
                </a>
                <a href="/perfil">
                  <img src="User.jpg" className="user-photo" alt="Foto do Usuário" />
                </a>
            </header>

            <div className="notifications-container">
                <a href="/index" className="back-btn" id="backBtn">
                  <BiArrowBack />
                </a>
                
                <div className="title-row">
                    <BiBell />
                    <h1>Notificações</h1>
                </div>
                
                <p>Permitir que o app envie notificações como:</p>
                
                {statusMessage && (
                    <div className={`status-message ${statusMessage.startsWith('ADICIONAR_ICON') ? 'success' : 'error'}`}>
                        {statusMessage}
                    </div>
                )}

                <div className="notification-options">
                    
                    <NotificationItem
                        label="Lembretes para coletas municipais"
                        checked={preferences.coletasMunicipais}
                        onToggle={() => handleToggle('coletasMunicipais')}
                    />
                    
                    <NotificationItem
                        label="Lembretes para coletas agendadas"
                        checked={preferences.coletasAgendadas}
                        onToggle={() => handleToggle('coletasAgendadas')}
                    />
                    
                    <NotificationItem
                        label="Alterações e/ou atualizações da plataforma"
                        checked={preferences.atualizacoesPlataforma}
                        onToggle={() => handleToggle('atualizacoesPlataforma')}
                    />
                    
                    <NotificationItem
                        label="Avisos gerais"
                        checked={preferences.avisosGerais}
                        onToggle={() => handleToggle('avisosGerais')}
                    />
                    
                </div>
            </div>
        </>
    );
};

const NotificationItem = ({ label, checked, onToggle }) => (
    <label className="notification-item" onClick={onToggle}>
        {label}
        {checked ? <BiCheckSquare className="check-icon checked" /> : <BiSquare className="check-icon" />}
    </label>
);

export default Notificacoes;