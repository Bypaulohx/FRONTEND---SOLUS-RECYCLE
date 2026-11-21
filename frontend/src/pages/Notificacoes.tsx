import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import BackButton from '../components/BackButton';
import Layout from '../components/Layout';

const CHAVE = 'solus.notificacoes.v1';
const preferenciasPadrao: Record<string, boolean> = {
  'Coletas agendadas': true,
  'Lembretes de separação': true,
};

function carregar(): Record<string, boolean> {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return salvo ? { ...preferenciasPadrao, ...JSON.parse(salvo) } : { ...preferenciasPadrao };
  } catch {
    return { ...preferenciasPadrao };
  }
}

export default function Notificacoes() {
  const [preferencias, setPreferencias] = useState(carregar);

  useEffect(() => {
    localStorage.setItem(CHAVE, JSON.stringify(preferencias));
  }, [preferencias]);

  return (
    <Layout>
      <div className="content-container">
        <BackButton to="/perfil" />
        <div className="section-header">
          <Bell size={30} className="green-icon" />
          <h1 className="section-title">Notificações</h1>
        </div>
        <p className="company-address">Configure como deseja receber notificações.</p>
        <div className="preference-list">
          {Object.entries(preferencias).map(([label, ativo]) => (
            <div key={label} className="preference-row">
              <span>{label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={ativo}
                aria-label={label}
                className={`switch ${ativo ? 'on' : ''}`}
                onClick={() => setPreferencias((atual) => ({ ...atual, [label]: !atual[label] }))}
              >
                <span />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
