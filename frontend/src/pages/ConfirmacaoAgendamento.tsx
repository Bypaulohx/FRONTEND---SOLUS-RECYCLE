import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function ConfirmacaoAgendamento() {
  return (
    <Layout>
      <div className="content-container" style={{ padding: 20, maxWidth: 400, margin: '0 auto' }}>
        <Link to="/agendamento" className="back-btn">←</Link>
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Você possui 1 coleta agendada</h2>
        <div className="notification-card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, marginBottom: 5 }}>Associação dos Catadores de Material Reciclável - ASCAS</h3>
          <p>01/04 - Vidro</p>
          <p style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>*Deixe seus resíduos recicláveis prontos para retirada e fique atento ao seu telefone.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          <Link to="/confirmacao-cancelamento" className="green-btn" style={{ background: '#c00' }}>Cancelar coleta</Link>
          <Link to="/agendamento" className="green-btn">Reagendar</Link>
        </div>
        <h3 style={{ fontSize: 16, textAlign: 'center', marginBottom: 15 }}>Acesse o mapa para agendar novas coletas a domicílio</h3>
        <Link to="/mapa" className="green-btn" style={{ border: '2px solid #00C853', background: 'transparent', color: '#00C853' }}>Ir para o mapa</Link>
      </div>
    </Layout>
  );
}
