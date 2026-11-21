import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Check, MapPin, MessageCircle, Recycle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusPill from '../components/StatusPill';
import { solusApi, type AgendamentoDTO } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { sendMessage } from '../utils/operations';
import { abrirNavegacao } from '../utils/navigation';

function formatarData(valor: string): string {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Decisao {
  agendamento: AgendamentoDTO;
  acao: 'receber' | 'recusar' | 'buscar';
}

export default function DashboardEmpresa() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState<AgendamentoDTO[]>([]);
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState<number | null>(null);
  const [decisao, setDecisao] = useState<Decisao | null>(null);

  const companyId = user?.id;

  useEffect(() => {
    if (!companyId) return;
    localStorage.setItem('solus.company.id', String(companyId));
    let ativo = true;
    solusApi.agendamentosDaEmpresa(companyId).then(({ data, error }) => {
      if (!ativo) return;
      if (error) setErro(error);
      else setAgendamentos(data ?? []);
    });
    return () => {
      ativo = false;
    };
  }, [companyId]);

  const pendentes = useMemo(() => agendamentos.filter((item) => item.status === 'PENDENTE'), [agendamentos]);
  const agendadas = useMemo(() => agendamentos.filter((item) => item.status === 'CONFIRMADO'), [agendamentos]);
  const concluidas = useMemo(() => agendamentos.filter((item) => item.status === 'CONCLUIDO'), [agendamentos]);

  async function executarDecisao() {
    if (!decisao) return;
    const { agendamento, acao } = decisao;
    if (acao === 'buscar') {
      sendMessage(agendamento.id, 'Estou indo buscar os materiais. Até já!', 'COMPANY');
      abrirNavegacao({
        endereco: agendamento.userEndereco ?? 'Endereço do cliente',
        label: `Coleta #${agendamento.id}`,
      });
    }
    setProcessando(agendamento.id);
    setErro('');
    const { data, error } = acao === 'recusar'
      ? await solusApi.recusarAgendamento(agendamento.id)
      : await solusApi.confirmarAgendamento(agendamento.id);
    setProcessando(null);
    setDecisao(null);
    if (error || !data) {
      setErro(error ?? 'Não foi possível atualizar a coleta.');
      return;
    }
    setAgendamentos((atual) => atual.map((item) => (item.id === agendamento.id ? data : item)));
    if (acao === 'buscar' || acao === 'receber') {
      navigate(acao === 'buscar' ? `/conversas?coleta=${agendamento.id}` : '/agenda-empresa');
    }
  }

  const nome = user?.nomeFantasia ?? user?.nome ?? 'Organização';

  return (
    <Layout>
      <div className="ops-page">
        <div className="ops-header">
          <div>
            <p className="ops-eyebrow">Painel da organização</p>
            <h1>{nome}</h1>
            <p className="ops-subtitle">Solus Reciclagem · Unidade Paulista</p>
          </div>
          <Recycle size={26} className="ops-header-icon" />
        </div>

        {erro && <p className="form-error">{erro}</p>}

        <div className="kpi-row">
          <div className="kpi-card featured"><strong>{pendentes.length}</strong><span>aguardando</span></div>
          <div className="kpi-card"><strong>{agendadas.length}</strong><span>agendadas</span></div>
          <div className="kpi-card"><strong>{concluidas.length}</strong><span>concluídas</span></div>
        </div>

        <div className="section-head">
          <h2>Decisões pendentes</h2>
          <Link to="/agenda-empresa" className="link-action">Ver todas <ArrowRight size={14} /></Link>
        </div>

        {pendentes.length === 0 ? (
          <div className="ops-empty"><Check size={22} /><p>Nenhuma solicitação aguardando decisão.</p></div>
        ) : (
          <div className="ops-stack">
            {pendentes.map((item) => (
              <article className="decision-card" key={item.id}>
                <div className="decision-top">
                  <span className="avatar-initials">{(item.userName ?? 'U').slice(0, 2).toUpperCase()}</span>
                  <div className="decision-info">
                    <h3>{item.userName ?? 'Morador'}</h3>
                    <p>{item.tipoResiduo ?? 'Materiais recicláveis'} · {item.pesoEstimado ?? 0} kg</p>
                    <p className="muted">{formatarData(item.scheduleTime)}</p>
                  </div>
                </div>
                <div className="decision-actions">
                  <button type="button" className="mini-btn primary" disabled={processando === item.id}
                    onClick={() => setDecisao({ agendamento: item, acao: 'receber' })}>
                    Receber
                  </button>
                  <button type="button" className="mini-btn outline" disabled={processando === item.id}
                    onClick={() => setDecisao({ agendamento: item, acao: 'buscar' })}>
                    Buscar
                  </button>
                  <button type="button" className="mini-btn ghost" disabled={processando === item.id}
                    onClick={() => setDecisao({ agendamento: item, acao: 'recusar' })}>
                    Recusar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="section-head">
          <h2>Próximas coletas</h2>
          <Link to="/agenda-empresa" className="link-action">Abrir agenda</Link>
        </div>
        <div className="ops-stack">
          {agendadas.concat(concluidas).slice(0, 4).map((item) => (
            <article className="ops-row" key={item.id}>
              <span className="ops-row-icon"><CalendarDays size={18} /></span>
              <div className="ops-row-body">
                <h3>{formatarData(item.scheduleTime)} · {item.userName ?? 'Morador'}</h3>
                <p>{item.tipoResiduo ?? 'Recicláveis'} · {item.pesoEstimado ?? 0} kg</p>
              </div>
              <StatusPill status={item.status} />
            </article>
          ))}
          {agendadas.length + concluidas.length === 0 && (
            <div className="ops-empty compact">Ainda não há coletas confirmadas hoje.</div>
          )}
        </div>

        <div className="ops-shortcuts">
          <Link to="/mapa-empresa"><MapPin size={18} /> Editar ponto</Link>
          <Link to="/conversas"><MessageCircle size={18} /> Conversas</Link>
          <Link to="/materiais-empresa"><Recycle size={18} /> Materiais</Link>
        </div>

        {decisao && (
          <div className="modal-overlay" role="presentation" onClick={() => setDecisao(null)}>
            <div className="modal-card" role="dialog" aria-modal="true" aria-label="Confirmar decisão" onClick={(e) => e.stopPropagation()}>
              <h2 className="section-title">Confirmar decisão</h2>
              <p className="modal-warning">
                {decisao.acao === 'receber' && `Confirmar o recebimento da coleta #${decisao.agendamento.id}?`}
                {decisao.acao === 'recusar' && `Recusar a coleta #${decisao.agendamento.id}? O morador será avisado.`}
                {decisao.acao === 'buscar' &&
                  `Você vai avisar no chat que está indo buscar e abrir a rota até ${decisao.agendamento.userEndereco ?? 'o endereço do cliente'}.`}
              </p>
              <button type="button" className="green-btn full" onClick={executarDecisao} disabled={processando !== null}>
                {processando !== null ? 'Aguarde...' : 'Confirmar'}
              </button>
              <button type="button" className="green-btn outline-btn full spaced-top" onClick={() => setDecisao(null)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
