import { useEffect, useState } from 'react';
import { CircleAlert, CircleCheckBig } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Layout from '../components/Layout';
import { solusApi } from '../api/client';

type Estado = 'idle' | 'ok' | 'erro';

export default function ConfirmacaoCancelamento() {
  const location = useLocation();
  const agendamentoId = (location.state as { agendamentoId?: number } | null)?.agendamentoId;
  const [estado, setEstado] = useState<Estado>(agendamentoId ? 'idle' : 'erro');
  const [erro, setErro] = useState(agendamentoId ? '' : 'Nenhum agendamento foi selecionado.');

  useEffect(() => {
    if (!agendamentoId) return;
    let ativo = true;
    solusApi.cancelarAgendamento(agendamentoId).then(({ error }) => {
      if (!ativo) return;
      if (error) {
        setErro(error);
        setEstado('erro');
      } else {
        setEstado('ok');
      }
    });
    return () => {
      ativo = false;
    };
  }, [agendamentoId]);

  const Sucesso = estado === 'ok' ? CircleCheckBig : CircleAlert;

  return (
    <Layout>
      <div className="content-container success-container">
        <BackButton to="/confirmacao-agendamento" />
        <Sucesso className="success-icon" size={88} strokeWidth={1.8} aria-hidden="true" />
        <h2>
          {estado === 'ok'
            ? 'Agendamento cancelado com sucesso!'
            : estado === 'erro'
              ? 'Não foi possível cancelar'
              : 'Cancelando agendamento...'}
        </h2>
        {estado === 'erro' && erro && <p className="form-error">{erro}</p>}
        <Link to="/home" className="green-btn">Ir para o início</Link>
      </div>
    </Layout>
  );
}
