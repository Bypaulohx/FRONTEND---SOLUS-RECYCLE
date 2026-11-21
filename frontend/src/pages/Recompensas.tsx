import { useState } from 'react';
import { Coins, Gift, Heart, Leaf, Recycle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { creditInReais, getCreditHistory, getCredits } from '../utils/operations';

const NIVEL_PRATA = 300;

export default function Recompensas() {
  const [extratoAberto, setExtratoAberto] = useState(false);
  const pontos = getCredits();
  const historico = getCreditHistory();
  const faltam = Math.max(0, NIVEL_PRATA - pontos);
  const progresso = Math.min(100, Math.round((pontos / NIVEL_PRATA) * 100));

  return (
    <Layout>
      <div className="ops-page rewards-page">
        <div className="ops-header">
          <div>
            <p className="ops-eyebrow">Reciclagem</p>
            <h1>Meus créditos</h1>
            <p className="ops-subtitle">Seu impacto vale</p>
          </div>
          <Leaf size={26} className="ops-header-icon" />
        </div>

        <section className="rewards-card">
          <strong>{pontos} pontos</strong>
          <span>≈ {creditInReais(pontos)} em crédito de reciclagem</span>
          <div className="rewards-progress" role="progressbar" aria-valuenow={progresso} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${progresso}%` }} />
          </div>
          <small>{faltam === 0 ? 'Nível Prata alcançado!' : `${faltam} pts para o nível Prata`}</small>
        </section>

        <h2 className="section-head-title">Como usar</h2>
        <div className="rewards-options">
          <div className="reward-option">
            <Coins size={20} />
            <div>
              <strong>Desconto em taxas do app</strong>
              <small>Use seus pontos como crédito em coletas futuras: 20 pts = R$ 1,00.</small>
            </div>
          </div>
          <div className="reward-option">
            <Gift size={20} />
            <div>
              <strong>Benefícios na coletora</strong>
              <small>Troque por descontos ou vantagens nas organizações parceiras cadastradas.</small>
            </div>
          </div>
          <div className="reward-option">
            <Heart size={20} />
            <div>
              <strong>Doar para uma ONG</strong>
              <small>Converta seus pontos em apoio a projetos de reciclagem e educação ambiental.</small>
            </div>
          </div>
        </div>

        <div className="section-head">
          <h2>Últimas coletas</h2>
          <button type="button" className="link-action" onClick={() => setExtratoAberto((valor) => !valor)}>
            {extratoAberto ? 'Fechar extrato' : 'Ver extrato de impactos'}
          </button>
        </div>

        {extratoAberto && (
          <p className="extrato-note">
            {historico.length} coletas confirmadas por QR. Pontos liberados somente após a leitura pelo recebedor.
          </p>
        )}

        <div className="ops-stack">
          {historico.map((item) => (
            <article className="reward-entry" key={item.id}>
              <span className="reward-check"><Recycle size={15} /></span>
              <div>
                <strong>+{item.points} pts · {item.material}</strong>
                <small>{item.date} · confirmado por QR</small>
              </div>
              <span className="reward-points">{item.points}</span>
            </article>
          ))}
        </div>

        <p className="rewards-footnote">Créditos liberados após a confirmação por QR no momento da coleta.</p>
        <Link to="/reciclagem" className="outline-btn full">O que posso reciclar</Link>
      </div>
    </Layout>
  );
}
