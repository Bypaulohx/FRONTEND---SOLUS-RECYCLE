import { useState } from 'react';
import {
  BatteryWarning,
  Can,
  ChevronDown,
  ChevronUp,
  Coins,
  Gift,
  GlassWater,
  Heart,
  Milk,
  Newspaper,
  ShieldCheck,
} from 'lucide-react';
import BackButton from '../components/BackButton';
import Layout from '../components/Layout';

const residuos = [
  {
    icon: Newspaper,
    titulo: 'Papel e papelão',
    texto: 'Caixas, jornal, revistas e folhas. Mantenha seco e limpo; dobre as caixas para ocupar menos espaço.',
  },
  {
    icon: Milk,
    titulo: 'Plástico',
    texto: 'Garrafas PET, embalagens, potes e tampinhas. Enxágue rapidamente e separe por tipo de resina quando possível.',
  },
  {
    icon: GlassWater,
    titulo: 'Vidro',
    texto: 'Garrafas, frascos e recipientes. Retire tampas e não misture com cerâmica ou espelhos.',
  },
  {
    icon: Can,
    titulo: 'Metal',
    texto: 'Latas de alumínio, arames e utensílios. Enxágue e compacte as latas sem deixar resíduos de alimentos.',
  },
  {
    icon: BatteryWarning,
    titulo: 'Eletrônicos e pilhas',
    texto: 'Leve a pontos específicos de descarte. Nunca jogue pilhas, baterias ou aparelhos no lixo comum.',
  },
];

const recompensas = [
  { icon: Coins, titulo: 'Desconto em taxa do app', texto: 'Cada 20 pontos valem R$ 1,00 em coletas futuras.' },
  { icon: Gift, titulo: 'Benefícios na coletora', texto: 'Vantagens e descontos nas organizações parceiras cadastradas.' },
  { icon: Heart, titulo: 'Doar para uma ONG', texto: 'Converta seus pontos em apoio a projetos de reciclagem e educação ambiental.' },
];

export default function Reciclagem() {
  const [aberto, setAberto] = useState<number | null>(null);

  return (
    <Layout>
      <div className="reciclagem-container">
        <BackButton to="/home" />
        <h2 className="section-title">O que posso reciclar</h2>
        <p className="company-address spaced-bottom">
          Separe os materiais com segurança e ganhe créditos a cada coleta confirmada.
        </p>

        <div className="faq-list">
          {residuos.map((item, index) => {
            const Icone = item.icon;
            return (
              <div key={item.titulo} className="faq-item">
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setAberto(aberto === index ? null : index)}
                  aria-expanded={aberto === index}
                >
                  <span className="faq-question-label"><Icone size={19} /> {item.titulo}</span>
                  {aberto === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {aberto === index && <p className="faq-answer">{item.texto}</p>}
              </div>
            );
          })}
        </div>

        <div className="safety-box">
          <ShieldCheck size={20} />
          <div>
            <strong>Descarte seguro</strong>
            <p>
              Use luvas ao manusear materiais cortantes, nunca misture resíduos químicos ou hospitalares com
              recicláveis e mantenha os volumes secos até a coleta.
            </p>
          </div>
        </div>

        <h3 className="section-head-title">Seus pontos também valem</h3>
        <div className="reward-explanations">
          {recompensas.map((item) => {
            const Icone = item.icon;
            return (
              <div key={item.titulo} className="reward-explanation">
                <Icone size={18} />
                <div><strong>{item.titulo}</strong><small>{item.texto}</small></div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
