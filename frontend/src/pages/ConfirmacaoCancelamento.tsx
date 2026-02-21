import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function ConfirmacaoCancelamento() {
  return (
    <Layout>
      <div className="success-container" style={{ padding: 20, flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Link to="/agendamento" className="back-btn">←</Link>
        <h2>Agendamento cancelado com sucesso!</h2>
        <Link to="/home" className="green-btn">Ir para a home</Link>
      </div>
    </Layout>
  );
}
