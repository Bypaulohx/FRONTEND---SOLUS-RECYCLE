import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, MessageCircle, QrCode } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusPill from '../components/StatusPill';
import { solusApi, type AgendamentoDTO } from '../api/client';

function dataHora(valor: string): string {
  const data = new Date(valor);
  return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export default function ConfirmacaoAgendamento() {
  const location = useLocation();
  const [params] = useSearchParams();
  const recebido = (location.state as { agendamento?: AgendamentoDTO } | null)?.agendamento;
  const [agendamentos, setAgendamentos] = useState<AgendamentoDTO[]>(recebido ? [recebido] : []);

  useEffect(() => {
    let ativo = true;
    solusApi.meusAgendamentos().then(({ data, error }) => {
      if (!ativo || error || !data) return;
      setAgendamentos((atual) => {
        const ids = new Set(data.map((item) => item.id));
        return [...data, ...atual.filter((item) => !ids.has(item.id))];
      });
    });
    return () => {
      ativo = false;
    };
  }, []);

  const ativos = agendamentos
    .filter((item) => item.status === 'PENDENTE' || item.status === 'CONFIRMADO')
    .sort((a, b) => new Date(a.scheduleTime).getTime() - new Date(b.scheduleTime).getTime());
  const concluidos = agendamentos.filter((item) => item.status === 'CONCLUIDO' || item.status === 'CANCELADO');
  const pontoId = params.get('ponto');

  return (
    <Layout>
      <div className="ops-page">
        <h2 className="section-title text-center spacing-bottom">
          {ativos.length > 0
            ? `Você possui ${ativos.length} ${ativos.length === 1 ? 'coleta agendada' : 'coletas agendadas'}`
            : 'Sua agenda de reciclagem'}
        </h2>

        {pontoId && (
          <p className="helper-note text-center">
            Selecione uma coleta abaixo ou agende uma nova neste ponto.
          </p>
        )}

        {ativos.map((item) => (
          <div className="notification-card" key={item.id}>
            <div className="detail-head">
              <h3 className="title-md">{item.companyNomeFantasia ?? 'Solus Reciclagem'}</h3>
              <StatusPill status={item.status} />
            </div>
            <p className="collection-date">
              <CalendarDays size={16} /> {dataHora(item.scheduleTime)} · {item.tipoResiduo ?? 'Recicláveis'}
            </p>
            <p className="helper-note">
              *Deixe seus resíduos recicláveis prontos para retirada e fique atento ao seu telefone.
            </p>
            <div className="button-row compact">
              <Link to={`/qr-code?coleta=${item.id}`} className="green-btn"><QrCode size={17} /> Mostrar QR</Link>
              <Link to={`/conversas?coleta=${item.id}`} className="green-btn outline-btn">
                <MessageCircle size={17} /> Conversar
              </Link>
            </div>
            <Link
              to="/confirmacao-cancelamento"
              state={{ agendamentoId: item.id }}
              className="green-btn danger-btn full"
            >
              Cancelar coleta
            </Link>
          </div>
        ))}

        {ativos.length === 0 && (
          <div className="ops-empty">Você ainda não possui coletas agendadas.</div>
        )}

        {concluidos.length > 0 && (
          <div className="history-list">
            <h3 className="section-head-title">Histórico</h3>
            {concluidos.map((item) => (
              <div className="history-row" key={item.id}>
                <MapPin size={15} />
                <span>{item.companyNomeFantasia ?? 'Solus Reciclagem'} · {dataHora(item.scheduleTime)}</span>
                <StatusPill status={item.status} />
              </div>
            ))}
          </div>
        )}

        <Link to={`/agendamento${pontoId ? `?ponto=${pontoId}` : ''}`} className="green-btn full spaced-top">
          <CalendarDays size={17} /> Agendar uma coleta
        </Link>
      </div>
    </Layout>
  );
}
