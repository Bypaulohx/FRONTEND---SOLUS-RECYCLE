import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function DetalhesPonto() {
  return (
    <Layout>
      <div className="content-container" style={{ padding: 20 }}>
        <Link to="/mapa" className="back-btn">← Voltar</Link>
        <h2 style={{ fontSize: 24, marginTop: 15, marginBottom: 10 }}>Associação dos Catadores - ASCAS</h2>
        <p className="address" style={{ color: '#00C853', marginBottom: 5 }}>Av. LO 3, 764 - Palmas, TO</p>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Coleta em domicílio disponível</p>
        <p style={{ fontSize: 12, color: '#666' }}>Metal e Vidro - mínimo 10kg</p>
        <div style={{ display: 'flex', gap: 15, marginTop: 25, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/agendamento" className="green-btn">Agendar coleta</Link>
          <a href="tel:+63984678637" className="green-btn" style={{ background: 'transparent', border: '2px solid #00C853', color: '#00C853' }}>Ligar</a>
        </div>
      </div>
    </Layout>
  );
}
