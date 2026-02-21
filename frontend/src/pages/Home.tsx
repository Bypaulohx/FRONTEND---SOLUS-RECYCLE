import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const nome = user?.nome ?? user?.email ?? 'User';

  return (
    <Layout>
      <div className="home-container">
        <h1>Olá, {nome}</h1>
        <div className="notification-card">
          <p>A próxima coleta municipal será em <span className="date">01/04 - 15h</span></p>
          <Link to="/mapa" className="green-btn" style={{ display: 'inline-block', marginTop: 10 }}>Ver local</Link>
        </div>
        <div className="cards-grid">
          <div className="card">
            <Link to="/mapa" className="card-icon">
              <i className="bi bi-geo-alt" />
              <p>Veja pontos de coleta</p>
            </Link>
          </div>
          <div className="card">
            <Link to="/encontrar-catadores" className="card-icon">
              <i className="bi bi-search" />
              <p>Encontrar catadores</p>
            </Link>
          </div>
          <div className="card">
            <Link to="/reciclagem" className="card-icon">
              <i className="bi bi-recycle" />
              <p>O que posso reciclar</p>
            </Link>
          </div>
          <div className="card">
            <Link to="/confirmacao-agendamento" className="card-icon">
              <i className="bi bi-calendar3" />
              <p>Coletas agendadas</p>
            </Link>
          </div>
        </div>
        <div className="action-section">
          <h2>Agende sua primeira coleta em domicílio:</h2>
          <Link to="/mapa" className="action-btn">Ir para o mapa</Link>
        </div>
      </div>
    </Layout>
  );
}
