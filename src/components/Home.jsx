import React, { useState, useEffect } from 'react';
import '../App.css';
import { Link } from 'react-router-dom';

const Backend_API = 'Backend_API'; 
const Backend_API_Perfil = 'Backend_API_Perfil'; 

const Home = () => {
    const [userName, setUserName] = useState('Usuário');
    const [nextCollection, setNextCollection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userResponse = await fetch(Backend_API_Perfil, {
                    headers:
                });
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    setUserName(userData.name || 'Usuário');
                }

                const collectionResponse = await fetch(Backend_API, {
                    headers:
                });
                
                if (collectionResponse.ok) {
                    const collectionData = await collectionResponse.json();
                    if (collectionData && collectionData.date) {
                        setNextCollection(collectionData);
                    } else {
                        setNextCollection(null);
                    }
                }
            } catch (err) {
                console.error("Erro ao carregar dados da Home:", err);
                setError("Não foi possível carregar as informações. Tente novamente.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const formatDate = (dateString, timeString) => {
        try {
            if (!dateString) return 'Data não definida';

            const date = new Date(`${dateString}T${timeString || '00:00:00'}`); 
            
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const hour = date.getHours().toString().padStart(2, '0');
            const minute = date.getMinutes().toString().padStart(2, '0');

            return `${day}/${month} - ${hour}h${minute !== '00' ? minute : ''}`;
        } catch (e) {
            console.error("Erro ao formatar data:", e);
            return 'Data inválida';
        }
    };

    const renderNotificationCard = () => {
        if (loading) {
            return (
                <div className="notification-card loading-card">
                    <p>Carregando informações da coleta...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="notification-card error-card">
                    <p>❌ {error}</p>
                </div>
            );
        }

        if (nextCollection) {
            const formattedDate = formatDate(nextCollection.date, nextCollection.time);
            return (
                <div className="notification-card next-collection">
                    <p>Sua próxima coleta agendada será em <span className="date">**{formattedDate}**</span></p>
                    <Link to="/confirmacao-agendamento" className="btn">Ver detalhes</Link>
                </div>
            );
        }

        return (
            <div className="notification-card no-collection">
                <p>Nenhuma coleta agendada. Que tal agendar a primeira?</p>
                <Link to="/agendamento" className="btn">Agendar agora</Link>
            </div>
        );
    };

    return (
        <div className="home-container">
            <h1>Olá, **{userName}**</h1>

            {renderNotificationCard()}
            <div className="cards-grid">
                <div className="card">
                    <Link to="/mapa" className="card-icon">
                        <i className="bi bi-geo-alt"></i>
                        <p>Veja pontos de coleta</p>
                    </Link>
                </div>
                <div className="card">
                    <Link to="/encontrar-catadores" className="card-icon">
                        <i className="bi bi-search"></i>
                        <p>Encontrar catadores</p>
                    </Link>
                </div>
                <div className="card">
                    <Link to="/reciclagem" className="card-icon">
                        <i className="bi bi-recycle"></i>
                        <p>O que posso reciclar</p>
                    </Link>
                </div>
                <div className="card">
                    <Link to="/confirmacao-agendamento" className="card-icon">
                        <i className="bi bi-calendar3"></i>
                        <p>Coletas agendadas</p>
                    </Link>
                </div>
            </div>

            <div className="action-section">
                <h2>Agende sua primeira coleta em domicílio:</h2>
                <Link to="/mapa" className="action-btn">Ir para o mapa</Link>
            </div>
        </div>
    );
};

export default Home;