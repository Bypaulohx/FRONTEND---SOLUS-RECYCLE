import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function Notificacoes() {
  return (
    <Layout>
      <div className="content-container" style={{ padding: 20 }}>
        <Link to="/perfil" className="back-btn">←</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
          <i className="bi bi-bell" style={{ fontSize: 30 }} />
          <h1 style={{ fontSize: 24 }}>Notificações</h1>
        </div>
        <p style={{ fontSize: 15, color: '#444', marginBottom: 20 }}>Configure como deseja receber notificações.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 16, color: '#666' }}>
            <span>Coletas agendadas</span>
            <i className="bi bi-toggle-on" style={{ fontSize: 30, color: '#00C853' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 16, color: '#666' }}>
            <span>Lembretes de separação</span>
            <i className="bi bi-toggle-on" style={{ fontSize: 30, color: '#00C853' }} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
