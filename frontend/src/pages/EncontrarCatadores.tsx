import { useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Layout from '../components/Layout';

const collectors = [
  { name: 'Vera Lúcia', info: 'Catadora Autônoma - Drone', materials: 'Papel/Papelão, Latas e Plásticos' },
  { name: 'Pedro Amaral', info: 'Catador Autônomo - Bicicleta', materials: 'Latas e Garrafas de Vidro' },
  { name: 'Moacir Pereira', info: 'Catador Autônomo - Carro', materials: 'Latas e Plásticos' },
  { name: 'Jaqueline Teixeira', info: 'Catadora Autônoma - Bicicleta', materials: 'Garrafas de Vidro e Plásticos' },
];

export default function EncontrarCatadores() {
  const [cep, setCep] = useState('');

  return (
    <Layout>
      <div className="content-container">
        <BackButton to="/home" />
        <h2 className="section-title">Encontre e converse com um catador perto de você</h2>
        <input
          type="text"
          placeholder="Digite seu CEP"
          className="cep-input"
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          aria-label="CEP"
        />
        <div className="collector-list">
          {collectors.map((collector) => (
            <Link to="/detalhes-ponto" key={collector.name} className="collector-card">
              <span className="collector-avatar" aria-hidden="true">
                {collector.name.charAt(0)}
              </span>
              <div>
                <h3>{collector.name}</h3>
                <p>{collector.info}</p>
                <p>{collector.materials}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
