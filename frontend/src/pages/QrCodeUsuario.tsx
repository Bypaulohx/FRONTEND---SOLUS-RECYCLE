import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, MapPin, Recycle, RefreshCw } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Layout from '../components/Layout';
import { solusApi, type AgendamentoDTO } from '../api/client';

const VALIDADE_SEGUNDOS = 10 * 60;

function relogio(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  return `${String(minutos).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`;
}

export default function QrCodeUsuario() {
  const [params] = useSearchParams();
  const coletaParam = params.get('coleta');
  const [agendamentos, setAgendamentos] = useState<AgendamentoDTO[]>([]);
  const [restante, setRestante] = useState(VALIDADE_SEGUNDOS);
  const [geracao, setGeracao] = useState(Date.now());
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    solusApi.meusAgendamentos().then(({ data, error }) => {
      if (!ativo) return;
      if (error) setErro(error);
      else setAgendamentos((data ?? []).filter((item) => item.status === 'PENDENTE' || item.status === 'CONFIRMADO'));
    });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setRestante((valor) => Math.max(0, valor - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const coleta = useMemo(() => {
    const alvo = Number(coletaParam);
    const selecionada = coletaParam && Number.isFinite(alvo)
      ? agendamentos.find((item) => item.id === alvo)
      : undefined;
    return selecionada ?? agendamentos.find((item) => item.status === 'CONFIRMADO') ?? agendamentos[0];
  }, [coletaParam, agendamentos]);

  const valorQr = coleta
    ? `SOLUS|coleta=${coleta.id}|geracao=${geracao}|valido=${VALIDADE_SEGUNDOS}`
    : 'SOLUS|sem-coleta';

  return (
    <Layout>
      <div className="ops-page qr-page">
        <BackButton to="/confirmacao-agendamento" />
        <h1 className="section-title">Confirmar coleta</h1>
        <p className="page-text">Mostre este QR para a empresa</p>

        {erro && <p className="form-error">{erro}</p>}

        {coleta ? (
          <>
            <div className="qr-card">
              <QRCodeSVG
                value={valorQr}
                size={252}
                bgColor="#ffffff"
                fgColor="#111111"
                level="M"
                marginSize={0}
                title={`QR da coleta ${coleta.id}`}
              />
              <strong>Coleta #{coleta.id}</strong>
              <span className={`qr-validity ${restante === 0 ? 'expired' : ''}`}>
                <Clock size={15} />
                {restante === 0 ? 'Código expirado' : `Válido por ${relogio(restante)}`}
              </span>
            </div>

            <div className="qr-details">
              <p><MapPin size={17} /> {coleta.companyNomeFantasia ?? 'Solus Reciclagem'}</p>
              <p><Recycle size={17} /> {coleta.tipoResiduo ?? 'Recicláveis'} · {coleta.pesoEstimado ?? 0} kg</p>
            </div>

            <p className="qr-hint">A empresa escaneia este código para confirmar o recebimento dos materiais.</p>

            <button
              type="button"
              className="green-btn full"
              onClick={() => {
                setGeracao(Date.now());
                setRestante(VALIDADE_SEGUNDOS);
              }}
            >
              <RefreshCw size={17} /> Atualizar QR
            </button>
          </>
        ) : (
          <div className="ops-empty">
            <p>Você ainda não tem uma coleta para confirmar.</p>
            <Link to="/confirmacao-agendamento" className="green-btn">Ver minhas coletas</Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
