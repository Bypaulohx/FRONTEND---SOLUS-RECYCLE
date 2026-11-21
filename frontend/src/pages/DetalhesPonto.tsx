import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, MapPin, Recycle, Truck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Layout from '../components/Layout';
import { solusApi, type PontoColetaDTO } from '../api/client';
import { rotuloFuncionamento } from '../utils/geo';

export default function DetalhesPonto() {
  const [params] = useSearchParams();
  const pontoId = Number(params.get('ponto'));
  const [ponto, setPonto] = useState<PontoColetaDTO | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    solusApi.pontos().then(({ data }) => {
      if (!ativo) return;
      setPonto((data ?? []).find((item) => item.id === pontoId) ?? null);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [pontoId]);

  const materiais = (ponto?.materiais ?? (ponto?.tipoResiduo ?? '').split(/[,;]/))
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <Layout>
      <div className="content-container company-detail">
        <BackButton to="/mapa" />
        <div className="company-cover">
          <img src={ponto?.imagemUrl ?? '/assets/imagem-galpao.png'} alt="Local de coleta da organização" />
        </div>
        <h2 className="section-title">
          {ponto?.nome ?? (carregando ? 'Carregando...' : 'Organização de reciclagem')}
        </h2>
        {ponto?.companyNome && <p className="company-subtitle">{ponto.companyNome}</p>}

        <div className="company-info-list">
          <div className="company-info-row">
            <MapPin size={18} />
            <div>
              <strong>Endereço</strong>
              <span>
                {ponto?.endereco ?? 'Endereço não informado'}
                {ponto?.complemento ? ` — ${ponto.complemento}` : ''}
              </span>
            </div>
          </div>
          <div className="company-info-row">
            <Clock3 size={18} />
            <div>
              <strong>Funcionamento</strong>
              <span>{rotuloFuncionamento(ponto?.funcionamento)}</span>
            </div>
          </div>
          <div className="company-info-row">
            <Recycle size={18} />
            <div>
              <strong>Materiais aceitos</strong>
              <span>{materiais.length ? materiais.join(', ') : 'Recicláveis em geral'}</span>
            </div>
          </div>
          <div className="company-info-row">
            <Truck size={18} />
            <div>
              <strong>Coleta em domicílio</strong>
              <span>
                {ponto?.coletaDomicilio === false ? 'Não disponível' : 'Disponível'}
                {(ponto?.pesoMinimoKg != null || ponto?.pesoMaximoKg != null) &&
                  ` · ${ponto?.pesoMinimoKg ?? 0} kg a ${ponto?.pesoMaximoKg ?? '—'} kg`}
              </span>
            </div>
          </div>
        </div>

        <Link to={`/agendamento?empresa=${ponto?.companyId ?? ''}&ponto=${pontoId}`} className="green-btn full spaced-top">
          <CalendarDays size={17} /> Agendar coleta
        </Link>
      </div>
    </Layout>
  );
}
