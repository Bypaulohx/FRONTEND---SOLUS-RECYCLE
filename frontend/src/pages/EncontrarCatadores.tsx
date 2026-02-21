import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const collectors = [
  { name: 'Vera Lúcia', info: '47 coletas realizadas - Carroça', materials: 'Papel/Papelão, Latas e Plásticos', img: '/user-vera.png' },
  { name: 'Pedro Amaral', info: 'Catador Autônomo - Bicicleta', materials: 'Latas e Garrafas de Vidro', img: '/user-pedro.png' },
  { name: 'Moacir Pereira', info: 'Catador Autônomo - Carroça', materials: 'Papel, Plástico e Metal', img: '/user-moacir.png' },
];

export default function EncontrarCatadores() {
  const [cep, setCep] = useState('');

  return (
    <Layout>
      <div className="content-container" style={{ padding: 20 }}>
        <Link to="/home" className="back-btn">←</Link>
        <h2 style={{ fontSize: 20, marginBottom: 15 }}>Encontre e converse com um catador perto de você</h2>
        <input
          type="text"
          placeholder="Digite seu CEP"
          className="cep-input"
          value={cep}
          onChange={(e) => setCep(e.target.value)}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {collectors.map((c, i) => (
            <Link to="/detalhes-ponto" key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 15, background: '#f9f9f9', borderRadius: 10, color: 'inherit' }}>
              <img src={c.img} alt={c.name} style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).src = '/User.jpg'; }} />
              <div>
                <h3 style={{ fontSize: 16, marginBottom: 5 }}>{c.name}</h3>
                <p style={{ fontSize: 14, color: '#666' }}>{c.info}</p>
                <p style={{ fontSize: 14, color: '#666' }}>{c.materials}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
