import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Phone, Send } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Layout from '../components/Layout';
import { solusApi, type AgendamentoDTO } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { getMessages, sendMessage, type ChatMessage } from '../utils/operations';

const RESPOSTAS_RAPIDAS = ['Estou a caminho', 'Pode deixar na portaria', 'Preciso de ajuda'];

function nomeContato(coleta: AgendamentoDTO, role: string | null): string {
  return role === 'COMPANY' ? coleta.userName ?? 'Morador' : coleta.companyNomeFantasia ?? 'Solus Reciclagem';
}

function ultimaMensagem(coletaId: number): string {
  const mensagens = getMessages(coletaId);
  return mensagens[mensagens.length - 1]?.text ?? 'Toque para abrir a conversa';
}

/** A mesma conversa é vista pelos dois papéis; cada lado vê suas mensagens à direita. */
function ladoMensagem(mensagem: ChatMessage, role: string | null): 'me' | 'them' {
  return mensagem.author ? (mensagem.author === role ? 'me' : 'them') : mensagem.from;
}

export default function Conversas() {
  const { role } = useAuth();
  const [params, setParams] = useSearchParams();
  const coletaParam = params.get('coleta');
  const [agendamentos, setAgendamentos] = useState<AgendamentoDTO[]>([]);
  const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState('');
  const [confirmarLigacao, setConfirmarLigacao] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ativo = true;
    const carregar = role === 'COMPANY' && params.get('empresa')
      ? solusApi.agendamentosDaEmpresa(Number(params.get('empresa')))
      : role === 'COMPANY'
        ? solusApi.agendamentosDaEmpresa(Number(localStorage.getItem('solus.company.id') ?? 0))
        : solusApi.meusAgendamentos();
    carregar.then(({ data, error }) => {
      if (!ativo) return;
      if (error) setErro(error);
      else setAgendamentos(data ?? []);
    });
    return () => {
      ativo = false;
    };
  }, [role]);

  const coletaId = useMemo(() => {
    const alvo = Number(coletaParam);
    if (coletaParam && Number.isFinite(alvo) && agendamentos.some((item) => item.id === alvo)) return alvo;
    return agendamentos.some((item) => item.id === Number(localStorage.getItem('solus.demo.coleta')))
      ? Number(localStorage.getItem('solus.demo.coleta'))
      : null;
  }, [coletaParam, agendamentos]);

  const coleta = agendamentos.find((item) => item.id === coletaId);

  useEffect(() => {
    setMensagens(coletaId ? getMessages(coletaId) : []);
  }, [coletaId]);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [mensagens]);

  function enviar(conteudo: string) {
    const limpo = conteudo.trim();
    if (!coletaId || !limpo) return;
    setMensagens(sendMessage(coletaId, limpo, role ?? 'USER'));
    setTexto('');
  }

  function ligar() {
    if (!coleta) return;
    const numero = role === 'COMPANY' ? coleta.userTelefone : coleta.companyTelefone;
    if (!numero) {
      setErro('Telefone não cadastrado para este contato.');
      setConfirmarLigacao(false);
      return;
    }
    enviar('Estou chegando para a coleta!');
    setConfirmarLigacao(false);
    window.location.href = `tel:${numero.replace(/[^\d+]/g, '')}`;
  }

  if (!coletaParam) {
    return (
      <Layout>
        <div className="ops-page chat-page">
          <div className="chat-header">
            <span className="chat-avatar"><MessageCircle size={20} /></span>
            <div>
              <h1>Conversas</h1>
              <p>Mensagens sobre suas coletas</p>
            </div>
          </div>
          {erro && <p className="form-error">{erro}</p>}
          {agendamentos.length === 0 && (
            <div className="ops-empty">Você ainda não tem conversas de coleta.</div>
          )}
          <div className="chat-list">
            {agendamentos.map((item) => (
              <button
                type="button"
                key={item.id}
                className="chat-list-item"
                onClick={() => setParams({ coleta: String(item.id) })}
              >
                <span className="chat-avatar">
                  {nomeContato(item, role).slice(0, 2).toUpperCase()}
                </span>
                <span className="chat-list-content">
                  <strong>{nomeContato(item, role)}</strong>
                  <small>Coleta #{item.id} · {item.tipoResiduo ?? 'Recicláveis'}</small>
                  <span className="chat-list-preview">{ultimaMensagem(item.id)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ops-page chat-page">
        <BackButton to="/conversas" />

        <div className="chat-header">
          <span className="chat-avatar">
            {(coleta ? nomeContato(coleta, role) : 'SR').slice(0, 2).toUpperCase()}
          </span>
          <div className="chat-header-main">
            <h1>{coleta ? nomeContato(coleta, role) : 'Conversa'}</h1>
            <p>{coleta ? `Coleta #${coleta.id} · ${coleta.companyNomeFantasia ?? 'Solus Reciclagem'}` : 'Conversas sobre coletas'}</p>
          </div>
          {coleta && (
            <button type="button" className="chat-call" onClick={() => setConfirmarLigacao(true)} aria-label="Ligar e avisar chegada">
              <Phone size={19} />
            </button>
          )}
        </div>

        {erro && <p className="form-error">{erro}</p>}

        {coleta ? (
          <>
            <div className="chat-context">
              <MessageCircle size={16} />
              <span>{coleta.tipoResiduo ?? 'Recicláveis'} · {coleta.pesoEstimado ?? 0} kg · {coleta.companyNomeFantasia ?? 'Solus Reciclagem'}</span>
            </div>

            <div className="chat-thread" role="log" aria-live="polite" ref={threadRef}>
              {mensagens.length === 0 && (
                <p className="chat-empty">Nenhuma mensagem ainda. Escreva a primeira para combinar a coleta.</p>
              )}
              {mensagens.map((mensagem) => (
                <div key={mensagem.id} className={`chat-bubble ${ladoMensagem(mensagem, role)}`}>
                  <p>{mensagem.text}</p>
                  <small>{mensagem.time}</small>
                </div>
              ))}
            </div>

            <div className="quick-replies">
              {RESPOSTAS_RAPIDAS.map((resposta) => (
                <button type="button" key={resposta} onClick={() => enviar(resposta)}>{resposta}</button>
              ))}
            </div>

            <form
              className="chat-composer"
              onSubmit={(event) => {
                event.preventDefault();
                enviar(texto);
              }}
            >
              <input
                className="field-input"
                placeholder="Escreva uma mensagem"
                aria-label="Escreva uma mensagem"
                value={texto}
                onChange={(event) => setTexto(event.target.value)}
              />
              <button type="submit" aria-label="Enviar mensagem" disabled={!texto.trim()}>
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="ops-empty">Conversa não encontrada.</div>
        )}

        {confirmarLigacao && (
          <div className="modal-overlay" role="presentation" onClick={() => setConfirmarLigacao(false)}>
            <div className="modal-card" role="dialog" aria-modal="true" aria-label="Avisar chegada" onClick={(e) => e.stopPropagation()}>
              <h2 className="section-title">Avisar que chegou?</h2>
              <p className="modal-warning">
                Vamos avisar no chat que você está chegando e abrir o discador com o telefone cadastrado.
              </p>
              <button type="button" className="green-btn full" onClick={ligar}>Avisar e ligar</button>
              <button type="button" className="green-btn outline-btn full spaced-top" onClick={() => setConfirmarLigacao(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
