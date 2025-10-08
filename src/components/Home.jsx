import React from 'react';
import '../App.css';

const Home = () => (
  <div className="home-container">
    <h1>Olá, User</h1>

    <div className="notification-card">
      <p>A próxima coleta municipal será em <span className="date">01/04 - 15h</span></p>
      <button className="btn">Ver local</button>
    </div>

    <div className="cards-grid">
      <div className="card">
        <a href="/src/components/Mapa.jsx" className="card-icon">
          <i className="bi bi-geo-alt"></i>
          <p>Veja pontos de coleta</p>
        </a>
      </div>
      <div className="card">
        <a href="/encontrar-catadores" className="card-icon">
          <i className="bi bi-search"></i>
          <p>Encontrar catadores</p>
        </a>
      </div>
      <div className="card">
        <a href="/reciclagem" className="card-icon">
          <i className="bi bi-recycle"></i>
          <p>O que posso reciclar</p>
        </a>
      </div>
      <div className="card">
        <a href="/confirmacao-agendamento" className="card-icon">
          <i className="bi bi-calendar3"></i>
          <p>Coletas agendadas</p>
        </a>
      </div>
    </div>

    <div className="action-section">
      <h2>Agende sua primeira coleta em domicílio:</h2>
      <a href="/mapa" className="action-btn">Ir para o mapa</a>
    </div>
  </div>
);

export default Home;