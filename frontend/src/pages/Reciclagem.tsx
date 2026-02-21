import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const itens = [
  { icon: '/Papel.png', text: 'Caixas ou pedaços de Papel, Jornal, Revistas, Folhas, etc.' },
  { icon: '/Plastico.png', text: 'Embalagens, garrafas, PET, potes, tampinhas, etc.' },
  { icon: '/Vidro.png', text: 'Garrafas, frascos e recipientes no geral' },
  { icon: '/Metal.png', text: 'Latas, arames, utensílios de cozinha' },
  { icon: '/Metal.png', text: 'Eletrônicos e pilhas (descarte correto)' },
];

export default function Reciclagem() {
  return (
    <Layout>
      <div className="reciclagem-container">
        <Link to="/agendamento" className="back-btn">←</Link>
        <h2>Resíduos que você pode separar para coleta</h2>
        <div className="residuos-grid">
          {itens.map((item, i) => (
            <div key={i} className="residuos-item">
              <img src={item.icon} alt="" className="residuos-icon" />
              <p>{item.text}</p>
            </div>
          ))}
        </div>
        <Link to="/home" className="green-btn">Voltar</Link>
      </div>
    </Layout>
  );
}
