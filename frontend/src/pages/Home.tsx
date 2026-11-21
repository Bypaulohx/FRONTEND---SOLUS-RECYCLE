import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, MessageCircle, QrCode, Recycle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { solusApi, type AgendamentoDTO } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const nome = user?.nome ?? 'Usuário';
  const [proxima, setProxima] = useState<AgendamentoDTO | null>(null);

  useEffect(() => {
    let ativo = true;
    solusApi.meusAgendamentos().then(({ data }) => {
      if (!ativo || !data) return;
      const ativas = data
        .filter((item) => item.status === 'PENDENTE' || item.status === 'CONFIRMADO')
        .sort((a, b) => new Date(a.scheduleTime).getTime() - new Date(b.scheduleTime).getTime());
      setProxima(ativas[0] ?? null);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const dataHora = proxima
    ? `${new Date(proxima.scheduleTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${new Date(
        proxima.scheduleTime
      ).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : '';

  return (
    <Layout>
      <div className="home-container">
        <h1>Olá, {nome}</h1>
        <div className="notification-card">
          <p>
            {proxima ? (
              <>Sua reciclagem será feita em <span className="date">{dataHora}</span> com {proxima.companyNomeFantasia ?? 'Solus Reciclagem'}.</>
            ) : (
              <>Encontre pontos de coleta perto de você e agende sua primeira coleta.</>
            )}
          </p>
          <Link to={proxima ? `/qr-code?coleta=${proxima.id}` : '/mapa'} className="green-btn">
            {proxima ? <><QrCode size={17} /> Ver QR</> : 'Ver local'}
          </Link>
        </div>
        <div className="cards-grid">
          <div className="card">
            <Link to="/mapa" className="card-icon">
              <MapPin size={26} strokeWidth={2} />
              <p>Veja pontos de coleta</p>
            </Link>
          </div>
          <div className="card">
            <Link to="/conversas" className="card-icon">
              <MessageCircle size={26} strokeWidth={2} />
              <p>Conversas</p>
            </Link>
          </div>
          <div className="card">
            <Link to="/recompensas" className="card-icon">
              <Sparkles size={26} strokeWidth={2} />
              <p>Recompensas</p>
            </Link>
          </div>
          <div className="card">
            <Link to="/reciclagem" className="card-icon">
              <Recycle size={26} strokeWidth={2} />
              <p>O que posso reciclar</p>
            </Link>
          </div>
        </div>
        <div className="action-section">
          <h2>{proxima ? 'Acompanhe sua coleta:' : 'Agende sua coleta em domicílio:'}</h2>
          <div className="button-row">
            <Link to={proxima ? `/qr-code?coleta=${proxima.id}` : '/mapa'} className="action-btn">
              {proxima ? 'Mostrar QR' : 'Ir para o mapa'}
            </Link>
            <Link to="/confirmacao-agendamento" className="green-btn outline-btn">
              <CalendarDays size={17} /> Minhas coletas
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
