import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

export default function Perfil() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleSair() {
    logout();
    navigate('/');
  }

  return (
    <Layout>
      <div className="content-container">
        <div className="user-name">{user?.nome ?? user?.email ?? 'User'}</div>
        <ul className="menu-list">
          <li>
            <Link to="/meus-dados" className="menu-item">
              <i className="bi bi-person" /> Meus dados
            </Link>
          </li>
          <li>
            <Link to="/notificacoes" className="menu-item">
              <i className="bi bi-bell" /> Notificações
            </Link>
          </li>
          <li>
            <Link to="/ajuda" className="menu-item">
              <i className="bi bi-question-circle" /> Ajuda
            </Link>
          </li>
          <li>
            <button type="button" onClick={handleSair} className="menu-item" style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', font: 'inherit', cursor: 'pointer' }}>
              <i className="bi bi-box-arrow-right" /> Sair
            </button>
          </li>
        </ul>
      </div>
    </Layout>
  );
}
