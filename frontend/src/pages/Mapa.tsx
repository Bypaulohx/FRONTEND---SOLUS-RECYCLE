import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const points = [
  { id: 1, title: 'Associação de Catadores (ASCAS)', address: 'Av. LO 3, 764', hours: 'Aberto de seg. a sex. das 7h30 às 17h', phone: '(63) 98467-8637' },
  { id: 2, title: 'Prefeitura Municipal', address: 'Palmas - TO', hours: 'Seg a Sex 8h-17h', phone: '' },
  { id: 3, title: 'Reciminhas Comércio de Metais', address: 'Av. JK, 689', hours: 'Seg a Sex 8h-18h', phone: '' },
];

export default function Mapa() {
  const [expanded, setExpanded] = useState(false);
  const [cep, setCep] = useState('');

  return (
    <Layout>
      <div className="map-container">
        <div className="map" id="map">
          <div style={{ width: '100%', height: '100%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
            Mapa (integrar Leaflet/Google Maps)
          </div>
        </div>
        <div className="collection-points-container">
          <div className="collection-header">
            <i
              className="bi bi-chevron-compact-up"
              style={{ cursor: 'pointer', transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)' }}
              onClick={() => setExpanded(!expanded)}
              role="button"
              aria-label="Expandir lista"
            />
            <h2>Encontre pontos de coleta e organizações perto de você</h2>
          </div>
          <input
            type="text"
            placeholder="Digite seu CEP"
            className="cep-input"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
          />
          <div className="collection-points">
            {points.map((p) => (
              <Link to="/detalhes-ponto" key={p.id} className="point">
                <i className="bi bi-geo-fill" style={{ fontSize: 20, color: '#00C853' }} />
                <div className="point-content">
                  <h3>{p.title}</h3>
                  <p>{p.address}</p>
                  <p className="opening-hours">{p.hours}</p>
                  {p.phone && <p>{p.phone}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
