import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import BackButton from '../components/BackButton';
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
        <BackButton to="/perfil" />
        <h2 className="section-title">Ajuda</h2>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={faq.q} className="faq-item">
              <button
                type="button"
                className="faq-question"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                aria-expanded={openIndex === index}
              >
                {faq.q}
                {openIndex === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {openIndex === index && <p className="faq-answer">{faq.a}</p>}
            </div>
          ))}
        </div>
        <div className="contact-box">
          Dúvidas? Entre em contato:{' '}
          <a href="mailto:contato@solusrecycle.app">contato@solusrecycle.app</a>
        </div>
      </div>
    </Layout>
  );
}
