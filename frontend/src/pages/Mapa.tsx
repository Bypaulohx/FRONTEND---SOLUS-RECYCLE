import { useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ChevronDown, ChevronUp, Clock3, LoaderCircle, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import Layout from '../components/Layout';
import { solusApi, type PontoColetaDTO } from '../api/client';
import { digits, formatCep } from '../utils/format';
import { abertoAgora, distanciaKm, geocodificar, rotuloFuncionamento, type Coordenada } from '../utils/geo';

const CENTRO_PADRAO: Coordenada = [-23.5505, -46.6333];

const markerIcon = L.divIcon({
  className: 'solus-marker',
  html: '<span class="solus-marker-pin"><span class="solus-marker-dot"></span></span>',
  iconSize: [36, 44],
  iconAnchor: [18, 40],
  popupAnchor: [0, -36],
});

function Centralizador({ center, revisao }: { center: Coordenada; revisao: number }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.flyTo(center, 14, { duration: 0.8 });
  }, [center, map, revisao]);
  return null;
}

function materiaisDoPonto(ponto: PontoColetaDTO): string[] {
  const lista = ponto.materiais?.length ? ponto.materiais : (ponto.tipoResiduo ?? '').split(/[,;]/);
  return lista.map((item) => item.trim()).filter(Boolean);
}

export default function Mapa() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [termo, setTermo] = useState('');
  const [pontos, setPontos] = useState<PontoColetaDTO[]>([]);
  const [centro, setCentro] = useState<Coordenada>(CENTRO_PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [material, setMaterial] = useState('');
  const [raio, setRaio] = useState(40);
  const [somenteAbertos, setSomenteAbertos] = useState(false);
  const arrasteInicio = useRef<number | null>(null);

  useEffect(() => {
    let ativo = true;
    solusApi.pontos().then(({ data }) => {
      if (!ativo) return;
      const validos = (data ?? []).filter(
        (ponto) =>
          Number.isFinite(ponto.latitude) &&
          Number.isFinite(ponto.longitude) &&
          !(ponto.latitude === 0 && ponto.longitude === 0)
      );
      setPontos(validos);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const materiais = useMemo(() => {
    const unico = new Set<string>();
    pontos.forEach((ponto) => materiaisDoPonto(ponto).forEach((item) => unico.add(item)));
    return [...unico].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [pontos]);

  const pontosFiltrados = useMemo(() => {
    return pontos
      .filter((ponto) => !material || materiaisDoPonto(ponto).includes(material))
      .filter((ponto) => !somenteAbertos || abertoAgora(ponto.funcionamento))
      .filter((ponto) => distanciaKm(centro, [ponto.latitude, ponto.longitude]) <= raio)
      .sort((a, b) => distanciaKm(centro, [a.latitude, a.longitude]) - distanciaKm(centro, [b.latitude, b.longitude]));
  }, [centro, material, pontos, raio, somenteAbertos]);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!termo.trim()) return;
    setBuscando(true);
    setMensagem('');
    try {
      let localizacao: Coordenada | null = null;
      if (digits(termo).length === 8) {
        const { data } = await solusApi.cep(formatCep(termo));
        if (data?.latitude != null && data?.longitude != null) {
          localizacao = [data.latitude, data.longitude];
        }
      }
      if (!localizacao) {
        const encontrado = await geocodificar(termo);
        if (encontrado) localizacao = [encontrado.latitude, encontrado.longitude];
      }
      if (!localizacao) {
        setMensagem('Não encontramos essa rua ou bairro. Tente outro termo.');
        return;
      }
      setCentro(localizacao);
      const perto = await solusApi.pontosProximos(localizacao[0], localizacao[1], 5);
      if (perto.data?.length) {
        setRaio(5);
        setMensagem(`${perto.data.length} ponto(s) encontrado(s) em até 5 km.`);
      } else {
        const longe = await solusApi.pontosProximos(localizacao[0], localizacao[1], 40);
        setRaio(40);
        setMensagem(
          longe.data?.length
            ? `Nenhum ponto em 5 km. Encontramos ${longe.data.length} em até 40 km.`
            : 'Nenhum ponto de coleta encontrado em até 40 km.'
        );
      }
    } catch {
      setMensagem('Não foi possível buscar agora. Tente novamente.');
    } finally {
      setBuscando(false);
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    arrasteInicio.current = e.clientY;
  }

  function onPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    if (arrasteInicio.current === null) return;
    const delta = e.clientY - arrasteInicio.current;
    arrasteInicio.current = null;
    if (Math.abs(delta) < 10) setExpanded((valor) => !valor);
    else setExpanded(delta < 0);
  }

  return (
    <Layout>
      <div className="map-container">
        <div className="map" aria-label="Mapa de pontos de coleta">
          <MapContainer center={centro} zoom={13} scrollWheelZoom zoomControl={false} className="leaflet-map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Centralizador center={centro} revisao={expanded ? 1 : 0} />
            {pontosFiltrados.map((ponto) => (
              <Marker
                key={ponto.id}
                position={[ponto.latitude, ponto.longitude]}
                icon={markerIcon}
                eventHandlers={{ click: () => navigate(`/detalhes-ponto?ponto=${ponto.id}`) }}
              >
                <Popup>
                  <strong>{ponto.nome ?? 'Ponto de coleta'}</strong>
                  <br />
                  {ponto.endereco ?? `${ponto.latitude.toFixed(4)}, ${ponto.longitude.toFixed(4)}`}
                  <br />
                  <Link to={`/detalhes-ponto?ponto=${ponto.id}`}>Ver detalhes da empresa</Link>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <span className="map-counter">
            {carregando ? 'Carregando...' : `${pontosFiltrados.length} ponto(s) no mapa`}
          </span>
        </div>

        <div className="collection-points-container">
          <div className="collection-header">
            <button
              type="button"
              className="sheet-handle"
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setExpanded((valor) => !valor);
              }}
              aria-label={expanded ? 'Recolher detalhes' : 'Expandir detalhes'}
              aria-expanded={expanded}
            >
              {expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              <span className="sheet-hint">
                {expanded ? 'Ver apenas nomes' : 'Ver detalhes dos pontos'}
              </span>
            </button>
            <h2>Encontre pontos de coleta<br />e organizações perto de você</h2>
          </div>

          <form className="cep-search-row" onSubmit={buscar}>
            <input
              type="text"
              placeholder="Rua ou bairro"
              className="cep-input"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              aria-label="Rua ou bairro"
            />
            <button type="submit" className="cep-search" aria-label="Buscar local" disabled={buscando}>
              {buscando ? <LoaderCircle size={19} className="spin" /> : <Search size={19} />}
            </button>
          </form>
          <button
            type="button"
            className="filter-toggle"
            onClick={() => setFiltrosAbertos((valor) => !valor)}
            aria-expanded={filtrosAbertos}
          >
            <SlidersHorizontal size={16} /> Filtros
          </button>
          {filtrosAbertos && (
            <div className="map-filters">
              <label>
                Material
                <select value={material} onChange={(e) => setMaterial(e.target.value)}>
                  <option value="">Todos</option>
                  {materiais.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label>
                Distância
                <select value={raio} onChange={(e) => setRaio(Number(e.target.value))}>
                  <option value={5}>Até 5 km</option>
                  <option value={10}>Até 10 km</option>
                  <option value={20}>Até 20 km</option>
                  <option value={40}>Até 40 km</option>
                </select>
              </label>
              <label className="switch-filter">
                <span><Clock3 size={15} /> Aberto neste horário</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={somenteAbertos}
                  className={`switch ${somenteAbertos ? 'on' : ''}`}
                  onClick={() => setSomenteAbertos((valor) => !valor)}
                >
                  <span />
                </button>
              </label>
            </div>
          )}
          {mensagem && <p className="map-message">{mensagem}</p>}

          <div className="collection-points">
            {pontosFiltrados.map((ponto) => {
              const distancia = distanciaKm(centro, [ponto.latitude, ponto.longitude]);
              return (
                <button
                  type="button"
                  key={ponto.id}
                  className={`point ${expanded ? 'detailed' : 'compact'}`}
                  onClick={() => {
                    setCentro([ponto.latitude, ponto.longitude]);
                    navigate(`/confirmacao-agendamento?ponto=${ponto.id}`);
                  }}
                >
                  <MapPin size={20} className="point-icon" />
                  <div className="point-content">
                    <h3>{ponto.nome ?? 'Ponto de coleta'}</h3>
                    <p className="point-distance">{distancia.toFixed(1).replace('.', ',')} km de você</p>
                    {expanded && (
                      <>
                        <p>{ponto.endereco ?? 'Endereço não informado'}</p>
                        {ponto.complemento && <p>{ponto.complemento}</p>}
                        {ponto.companyNome && <p className="opening-hours">{ponto.companyNome}</p>}
                        {ponto.tipoResiduo && <p className="opening-hours">Aceita: {ponto.tipoResiduo}</p>}
                        <p className="opening-hours">{rotuloFuncionamento(ponto.funcionamento)}</p>
                        <span
                          className="point-details-link"
                          role="link"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/detalhes-ponto?ponto=${ponto.id}`);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.stopPropagation();
                              navigate(`/detalhes-ponto?ponto=${ponto.id}`);
                            }
                          }}
                        >
                          Ver detalhes da empresa
                        </span>
                      </>
                    )}
                  </div>
                  {carregando && <LoaderCircle size={16} className="spin" />}
                </button>
              );
            })}
            {!carregando && pontosFiltrados.length === 0 && (
              <p className="page-text">Nenhum ponto encontrado com esses filtros.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
