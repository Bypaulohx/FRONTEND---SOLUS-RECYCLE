import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const faqs = [
  { q: 'Como agendar uma coleta?', a: 'Acesse o Mapa, escolha um ponto ou catador e preencha a data e os materiais.' },
  { q: 'Quais materiais são aceitos?', a: 'Papel, plástico, vidro, metal e eletrônicos, conforme o ponto de coleta.' },
  { q: 'Posso cancelar um agendamento?', a: 'Sim, em Coletas agendadas você pode cancelar ou reagendar.' },
];

export default function Ajuda() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Layout>
      <div className="content-container">
        <Link to="/perfil" className="back-btn">←</Link>
        <h2 style={{ fontSize: 20, marginTop: 30, marginBottom: 20 }}>Ajuda</h2>
        <div className="faq-section" style={{ marginBottom: 30 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 15, background: '#f9f9f9', border: 'none', borderRadius: 5, cursor: 'pointer', font: 'inherit', fontSize: 14, fontWeight: 'bold', textAlign: 'left' }}
              >
                {faq.q}
                <i className={`bi bi-chevron-${openIndex === i ? 'up' : 'down'}`} style={{ color: '#00C853' }} />
              </button>
              {openIndex === i && (
                <p style={{ padding: '10px 15px', fontSize: 14, color: '#666', background: '#fff', borderRadius: 5, marginTop: 5 }}>{faq.a}</p>
              )}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 14, color: '#666' }}>Dúvidas? Entre em contato: contato@greenbox.app</p>
      </div>
    </Layout>
  );
}
