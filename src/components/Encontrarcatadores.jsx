import React, { useState, useEffect, useCallback } from 'react';
import { BiSearch } from 'react-icons/bi';
import './style.css';

const initialCollectors = [

const Backend_API = 'Backend API'; 

const CollectorItem = ({ collector }) => (
    <a href={`/detalhes-ponto/${collector.id}`} className="collector-item">
        <img src={collector.image} alt={`Catador ${collector.name}`} className="collector-img" />
        <div>
            <h3>{collector.name}</h3>
            <p>{collector.description}</p>
            <p>{collector.materials}</p>
        </div>
    </a>
);


const Encontrarcatadores = () => {
    const [cep, setCep] = useState('');
    const [collectors, setCollectors] = useState(initialCollectors);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchCollectors = useCallback(async (searchCep = '') => {
        if (!searchCep || searchCep.length < 8) {
            setCollectors([]);
            return; 
        }

        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${Backend_API}?cep=${searchCep}`);

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            setCollectors(data); 

        } catch (err) {
            console.error("Erro ao buscar catadores:", err);
            setError("Não foi possível carregar os catadores. Tente novamente mais tarde.");
            setCollectors([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (cep.replace(/\D/g, '').length === 8) {
                fetchCollectors(cep.replace(/\D/g, ''));
            } else if (cep.replace(/\D/g, '').length === 0) {
                 setCollectors([]);
            }
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [cep, fetchCollectors]);

    const handleCepChange = (event) => {
        let value = event.target.value.replace(/\D/g, '');

        setCep(value.substring(0, 8));
    };

    return (
        <>
            <header className="header">
                <a href="/home">
                    <img src="/Logo Header.png" alt="GreenBox Logo" className="logo-icon" />
                </a>
                <a href="/perfil">
                    <img src="/User.jpg" alt="Foto do Usuário" className="user-photo" />
                </a>
            </header>

            <div className="container find-collectors-container">
                <a href="/home" className="back-btn">←</a>
                <h2>Encontre e converse com um catador perto de você</h2>
                
                <div className="input-container">
                    <BiSearch size={20} className="search-icon" /> 
                    <input 
                        type="text" 
                        placeholder="Digite seu CEP (apenas números)" 
                        className="cep-input"
                        value={cep}
                        onChange={handleCepChange}
                        maxLength={8}
                    />
                </div>

                <div className="collectors-list">
                    {loading && <p>Carregando catadores...</p>}
                    {error && <p className="error-message">❌ {error}</p>}
                    
                    {!loading && collectors.length === 0 && cep.replace(/\D/g, '').length === 8 && (
                        <p>Nenhum catador encontrado para o CEP **{cep}**.</p>
                    )}
                     
                    {!loading && collectors.length > 0 ? (
                        collectors.map(collector => (
                            <CollectorItem key={collector.id} collector={collector} />
                        ))
                    ) : (
                        !loading && cep.replace(/\D/g, '').length < 8 && (
                            <p>Digite um **CEP completo (8 dígitos)** para buscar catadores.</p>
                        )
                    )}
                </div>
            </div>

            <nav className="navbar">
                <a href="/home" className="nav-icon">
                    <i className="bi bi-house-door"></i><span>Home</span>
                </a>
                <a href="/mapa" className="nav-icon">
                    <i className="bi bi-geo-alt"></i><span>Mapa</span>
                </a>
                <a href="/encontrar-catadores" className="nav-icon active">
                    <i className="bi bi-search"></i><span>Busca</span>
                </a>
                <a href="/reciclagem" className="nav-icon">
                    <i className="bi bi-recycle"></i><span>Reciclagem</span>
                </a>
                <a href="/agendamento" className="nav-icon">
                    <i className="bi bi-calendar3"></i><span>Agenda</span>
                </a>
            </nav>
        </>
    );
};

export default Encontrarcatadores;