import React, { useState, useEffect } from 'react';
import { BiUser, BiBell, BiHelpCircle, BiLogOut } from 'react-icons/bi';

const Backend_API = 'Backend_API';

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken') || 'token'; 
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, 
    };
};

const Perfil = () => {
    const [userName, setUserName] = useState('Carregando...');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserName = async () => {
            try {
                const response = await fetch(Backend_API, {
                    method: 'GET',
                    headers: getAuthHeaders(),
                });

                if (!response.ok) {
                    throw new Error('Falha ao carregar dados do usuário.');
                }
                const data = await response.json();

                const fetchedName = data.name || data.username || 'Usuário'; 
                
                setUserName(fetchedName);
                
            } catch (err) {
                console.error("Erro ao buscar nome:", err);
                setError('Não foi possível carregar o nome.');
                setUserName('Usuário');
            } finally {
                setLoading(false);
            }
        };

        fetchUserName();
    }, []);
    
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

            <div className="content-container">

                {loading ? (
                    <div className="user-name">Carregando...</div>
                ) : error ? (
                    <div className="user-name error-text">{userName} (Erro)</div>
                ) : (
                    <div className="user-name">{userName}</div>
                )}

                <ul className="menu-list">
                    <li>
                        <a href="/meusdados" className="menu-item">
                            <BiUser className="menu-icon" />
                            Meus dados
                        </a>
                    </li>
                    <li>
                        <a href="/notificacoes" className="menu-item">
                            <BiBell className="menu-icon" />
                            Notificações
                        </a>
                    </li>
                    <li>
                        <a href="/ajuda" className="menu-item">
                            <BiHelpCircle className="menu-icon" />
                            Ajuda
                        </a>
                    </li>
                    <li>
                        <a href="/home" className="menu-item logout"> 
                            <BiLogOut className="menu-icon" />
                            Sair
                        </a>
                    </li>
                </ul>

                <img src="Solus Recycle Logo.png" className="fixed-image" alt="Solus Recycle" />
            </div>
        </>
    );
};

export default Perfil;
