import React, { useState, useEffect } from 'react';
import '../Header.css';

const Backend_API = 'Backend API'; 

const Header = () => {
    const [userPhotoUrl, setUserPhotoUrl] = useState('');
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(Backend_API, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error('Falha ao buscar dados do usuário');
                }

                const userData = await response.json();
                
                if (userData.photoUrl) {
                    setUserPhotoUrl(userData.photoUrl);
                } else {
                    setUserPhotoUrl('/assets/User_Default.jpg'); 
                }
            } catch (error) {
                console.error("Erro ao carregar a foto do usuário:", error);
                setUserPhotoUrl('/assets/User_Default.jpg'); 
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    return (
        <header className="header">
            <a href="/home">
                <img src="/assets/Logo Header.png" className="logo-icon" alt="Solus Recycle Logo" />
            </a>
            
            <a href="/perfil">
                {loading ? (
                    <div className="user-photo-placeholder"></div>
                ) : (
                    <img 
                        src={userPhotoUrl} 
                        className="user-photo" 
                        alt="Foto do Perfil do Usuário" 
                    />
                )}
            </a>
        </header>
    );
};

export default Header;