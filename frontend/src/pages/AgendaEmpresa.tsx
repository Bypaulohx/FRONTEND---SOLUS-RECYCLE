import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, QrCode } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusPill from '../components/StatusPill';
import { solusApi, type AgendamentoDTO } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

type Periodo = 'hoje' | 'semana' | 'mes';

function inicioDoDia(data: Date): number {
  const copia = new Date(data);
  copia.setHours(0, 0, 0, 0);
  return copia.getTime();
}

export default function AgendaEmpresa() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const coletaParam = params.get('coleta');
  const [agendamentos, setAgendamentos] = useState<AgendamentoDTO[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>('hoje');
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    solusApi.agendamentosDaEmpresa(user.id).then(({ data, error }) => {
      if (error) setErro(error);
      else {
        setAgendamentos(data ?? []);
        const alvo = Number(coletaParam);
        setSelecionado(
          Number.isFinite(alvo) && data?.some((item) => item.id === alvo)
            ? alvo
            : (data?.[0]?.id ?? null)
        );
      }
    });
  }, [user?.id, coletaParam]);

  const filtrados = useMemo(() => {
    const agora = new Date();
    const hoje = inicioDoDia(agora);
    const limite = periodo === 'hoje' ? hoje + 86_400_000 : periodo === 'semana' ? hoje + 7 * 86_400_000 : hoje + 31 * 86_400_000;
    return agendamentos.filter((item) => {
      const tempo = new Date(item.scheduleTime).getTime();
      return tempo >= hoje && tempo < limite;
    });
  }, [agendamentos, periodo]);

  const detalhe = agendamentos.find((item) => item.id === selecionado) ?? filtrados[0];

  function formatarHora(valor: string): string {
    return new Date(valor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatarData(valor: string): string {
    return new Date(valor).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  return (
    <Layout>
      <div className="ops-page">
        <div className="ops-header">
          <div>
            <p className="ops-eyebrow">Agenda da organização</p>
            <h1>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h1>
            <p className="ops-subtitle">{filtrados.length} {filtrados.length === 1 ? 'coleta' : 'coletas'} no período</p>
          </div>
        </div>

        {erro && <p className="form-error">{erro}</p>}

        <div className="ops-tabs">
          {(['hoje', 'semana', 'mes'] as Periodo[]).map((item) => (
            <button
              type="button"
              key={item}
              className={periodo === item ? 'active' : ''}
              onClick={() => setPeriodo(item)}
            >
              {item === 'hoje' ? 'Hoje' : item === 'semana' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>

        <div className="timeline">
          {filtrados.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`timeline-item ${detalhe?.id === item.id ? 'selected' : ''}`}
              onClick={() => setSelecionado(item.id)}
            >
              <span className="timeline-dot" />
              <span className="timeline-time">{formatarHora(item.scheduleTime)}</span>
              <span className="timeline-body">
                <strong>{item.userName ?? 'Morador'}</strong>
                <small>{item.tipoResiduo ?? 'Recicláveis'} · {item.pesoEstimado ?? 0} kg</small>
              </span>
              <StatusPill status={item.status} />
            </button>
          ))}
          {filtrados.length === 0 && <div className="ops-empty compact">Nenhuma coleta neste período.</div>}
        </div>

        {detalhe && (
          <section className="ops-detail-panel">
            <div className="detail-head">
              <h2>Coleta #{detalhe.id}</h2>
              <StatusPill status={detalhe.status} />
            </div>
            <p className="detail-line">{detalhe.userName ?? 'Morador'} · {detalhe.tipoResiduo ?? 'Recicláveis'} {detalhe.pesoEstimado ?? 0} kg</p>
            <p className="detail-line">Av. Paulista, 1000 — Bela Vista</p>
            <p className="detail-line">Janela {formatarHora(detalhe.scheduleTime)} · {formatarData(detalhe.scheduleTime)}</p>

            <div className="detail-divider" />
            <h3>Status da confirmação</h3>
            <ol className="status-steps">
              <li className="done">Solicitação enviada</li>
              <li className={detalhe.status !== 'PENDENTE' && detalhe.status !== 'CANCELADO' ? 'done' : ''}>
                Empresa aceitou a coleta
              </li>
              <li className={detalhe.status === 'CONCLUIDO' ? 'done' : 'current'}>
                {detalhe.status === 'CONCLUIDO' ? 'QR confirmado' : 'Aguardando QR de confirmação'}
              </li>
            </ol>

            <div className="button-row">
              <Link className="mini-btn outline" to={`/conversas?coleta=${detalhe.id}`}>
                <MessageCircle size={15} /> Abrir chat
              </Link>
              <Link className="mini-btn primary" to={`/escanear-qr?coleta=${detalhe.id}`}>
                <QrCode size={15} /> Confirmar com QR
              </Link>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
