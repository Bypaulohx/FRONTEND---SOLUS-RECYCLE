import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { GripVertical, Info, Plus, Save, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import { solusApi, type FuncionamentoDTO, type PontoColetaDTO } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import 'leaflet/dist/leaflet.css';

type Posicao = [number, number];

interface ConfigPonto {
  complemento: string;
  raioKm: number;
  materiais: string;
  pesoMinimo: string;
  pesoMaximo: string;
  recebeMateriais: boolean;
  coletaDomicilio: boolean;
  funcionamento: FuncionamentoDTO[];
}

const CONFIG_INICIAL: ConfigPonto = {
  complemento: '',
  raioKm: 5,
  materiais: '',
  pesoMinimo: '',
  pesoMaximo: '',
  recebeMateriais: true,
  coletaDomicilio: true,
  funcionamento: [],
};

function configDoPonto(ponto: PontoColetaDTO | null): ConfigPonto {
  if (!ponto) return CONFIG_INICIAL;
  return {
    complemento: ponto.complemento ?? '',
    raioKm: ponto.raioKm ?? 5,
    materiais: (ponto.materiais ?? (ponto.tipoResiduo ?? '').split(/[,;]/))
      .map((item) => item.trim())
      .filter(Boolean)
      .join(', '),
    pesoMinimo: ponto.pesoMinimoKg != null ? String(ponto.pesoMinimoKg) : '',
    pesoMaximo: ponto.pesoMaximoKg != null ? String(ponto.pesoMaximoKg) : '',
    recebeMateriais: ponto.recebeMateriais ?? true,
    coletaDomicilio: ponto.coletaDomicilio ?? true,
    funcionamento: (ponto.funcionamento ?? []).map((item) => ({ ...item })),
  };
}

function Centralizador({ centro }: { centro: Posicao }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.flyTo(centro, 15, { duration: 0.8 });
  }, [centro, map]);
  return null;
}

export default function MapaEmpresa() {
  const { user } = useAuth();
  const [pontos, setPontos] = useState<PontoColetaDTO[]>([]);
  const meusPontos = useMemo(
    () => pontos.filter((ponto) => ponto.companyId === user?.id),
    [pontos, user?.id]
  );
  const [selecionado, setSelecionado] = useState<PontoColetaDTO | null>(null);
  const [posicao, setPosicao] = useState<Posicao>([-23.5505, -46.6333]);
  const [config, setConfig] = useState<ConfigPonto>(CONFIG_INICIAL);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    solusApi.pontos().then(({ data, error }) => {
      if (!ativo) return;
      if (error || !data) {
        setErro(error ?? 'Não foi possível carregar os pontos.');
        return;
      }
      const validos = data.filter((ponto) => Number.isFinite(ponto.latitude) && Number.isFinite(ponto.longitude));
      // Todos os pontos continuam visíveis no mapa; apenas os desta organização entram na edição.
      setPontos(validos);
      const meus = user?.id ? validos.filter((ponto) => ponto.companyId === user.id) : [];
      const primeiro = meus[0];
      if (primeiro) {
        setSelecionado(primeiro);
        setPosicao([primeiro.latitude, primeiro.longitude]);
        setConfig(configDoPonto(primeiro));
      }
    });
    return () => {
      ativo = false;
    };
  }, [user?.id]);

  const icone = useMemo(
    () =>
      L.divIcon({
        className: 'solus-marker',
        html: '<div class="solus-marker-pin"><span class="solus-marker-dot"></span></div>',
        iconSize: [36, 44],
        iconAnchor: [18, 40],
      }),
    []
  );
  const iconeSecundario = useMemo(
    () =>
      L.divIcon({
        className: 'solus-marker solus-marker-secondary',
        html: '<div class="solus-marker-pin"><span class="solus-marker-dot"></span></div>',
        iconSize: [36, 44],
        iconAnchor: [18, 40],
      }),
    []
  );

  function atualizarConfig<K extends keyof ConfigPonto>(chave: K, valor: ConfigPonto[K]) {
    setConfig((atual) => ({ ...atual, [chave]: valor }));
  }

  function selecionarPonto(ponto: PontoColetaDTO) {
    setSelecionado(ponto);
    setPosicao([ponto.latitude, ponto.longitude]);
    setConfig(configDoPonto(ponto));
    setMensagem('');
    setErro('');
  }

  async function salvar() {
    if (!selecionado) return;
    setSalvando(true);
    setErro('');
    setMensagem('');
    const materiais = config.materiais.split(',').map((item) => item.trim()).filter(Boolean);
    const { data, error } = await solusApi.atualizarPonto(selecionado.id, {
      nome: selecionado.nome ?? 'Ponto de coleta',
      tipoResiduo: selecionado.tipoResiduo ?? 'Recicláveis',
      endereco: selecionado.endereco ?? '',
      latitude: posicao[0],
      longitude: posicao[1],
      complemento: config.complemento,
      raioKm: config.raioKm,
      materiais,
      pesoMinimoKg: config.pesoMinimo ? Number(config.pesoMinimo.replace(',', '.')) : null,
      pesoMaximoKg: config.pesoMaximo ? Number(config.pesoMaximo.replace(',', '.')) : null,
      recebeMateriais: config.recebeMateriais,
      coletaDomicilio: config.coletaDomicilio,
      funcionamento: config.funcionamento,
    });
    setSalvando(false);
    if (error || !data) {
      setErro(error ?? 'Não foi possível salvar o ponto.');
      return;
    }
    setPontos((atual) => atual.map((ponto) => (ponto.id === data.id ? data : ponto)));
    setSelecionado(data);
    setConfig(configDoPonto(data));
    setMensagem('Configurações salvas para este ponto.');
  }

  return (
    <Layout>
      <div className="ops-page map-empresa-page">
        <div className="ops-header">
          <div>
            <p className="ops-eyebrow">Mapa operacional</p>
            <h1>Editar ponto de coleta</h1>
            <p className="ops-subtitle">Arraste o pino para marcar o local exato</p>
          </div>
        </div>

        <div className="info-note">
          <Info size={17} />
          <p>
            Um <strong>ponto</strong> é cada local físico onde sua organização recebe materiais. Você pode ter
            vários pontos (galpão, unidade, feira); cada um tem endereço, raio, materiais e pesos próprios.
            Outros pontos que aparecem no mapa pertencem a outras empresas e não podem ser editados aqui.
          </p>
        </div>

        {erro && <p className="form-error">{erro}</p>}
        {mensagem && <p className="form-success">{mensagem}</p>}

        <div className="operational-map">
          <MapContainer center={posicao} zoom={15} scrollWheelZoom zoomControl={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Centralizador centro={posicao} />
            <Circle center={posicao} radius={config.raioKm * 1000} pathOptions={{ color: '#38c958', fillColor: '#38c958', fillOpacity: 0.08 }} />
            {pontos
              .filter((ponto) => ponto.companyId !== user?.id && selecionado?.id !== ponto.id)
              .map((ponto) => (
                <Marker
                  key={ponto.id}
                  position={[ponto.latitude, ponto.longitude]}
                  icon={iconeSecundario}
                  title={ponto.nome ?? 'Ponto de outra organização'}
                />
              ))}
            {meusPontos
              .filter((ponto) => ponto.id !== selecionado?.id)
              .map((ponto) => (
                <Marker
                  key={ponto.id}
                  position={[ponto.latitude, ponto.longitude]}
                  icon={iconeSecundario}
                  title={ponto.nome ?? `Ponto #${ponto.id}`}
                  eventHandlers={{ click: () => selecionarPonto(ponto) }}
                />
              ))}
            <Marker
              position={posicao}
              icon={icone}
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const marker = event.target as L.Marker;
                  const latLng = marker.getLatLng();
                  setPosicao([latLng.lat, latLng.lng]);
                },
              }}
            />
          </MapContainer>
          <div className="map-radius-pill">Raio de {config.raioKm} km</div>
          <div className="map-drag-pill"><GripVertical size={14} /> Arraste o pino</div>
        </div>

        <div className="map-edit-sheet">
          {meusPontos.length > 1 && (
            <label className="field-label">
              Ponto desta organização
              <select
                className="field-input"
                value={selecionado?.id ?? ''}
                onChange={(event) => {
                  const ponto = meusPontos.find((item) => item.id === Number(event.target.value));
                  if (ponto) selecionarPonto(ponto);
                }}
              >
                {meusPontos.map((ponto) => (
                  <option key={ponto.id} value={ponto.id}>{ponto.nome ?? `Ponto #${ponto.id}`}</option>
                ))}
              </select>
            </label>
          )}
          {meusPontos.length === 0 && (
            <p className="helper-note">
              Nenhum ponto cadastrado para esta organização. Os pontos exibidos no mapa pertencem a outras empresas e não podem ser editados aqui.
            </p>
          )}

          <label className="field-label">
            Endereço
            <input
              className="field-input"
              value={selecionado?.endereco ?? ''}
              onChange={(event) =>
                setSelecionado((atual) => (atual ? { ...atual, endereco: event.target.value } : atual))
              }
              disabled={!selecionado}
            />
          </label>

          <label className="field-label">
            Complemento deste ponto
            <input
              className="field-input"
              placeholder="Ex.: Galpão 2, entrada pela lateral"
              value={config.complemento}
              onChange={(event) => atualizarConfig('complemento', event.target.value)}
              disabled={!selecionado}
            />
          </label>

          <div className="slider-row">
            <span>Raio de atendimento</span>
            <strong>{config.raioKm} km</strong>
            <input
              type="range"
              min={1}
              max={20}
              value={config.raioKm}
              onChange={(event) => atualizarConfig('raioKm', Number(event.target.value))}
              disabled={!selecionado}
            />
          </div>

          <label className="field-label">
            Materiais aceitos neste ponto
            <input
              className="field-input"
              placeholder="Papel, Plástico, Vidro"
              value={config.materiais}
              onChange={(event) => atualizarConfig('materiais', event.target.value)}
              disabled={!selecionado}
            />
          </label>

          <div className="field-row">
            <label className="field-label">Peso mín. (kg)
              <input className="field-input" inputMode="decimal" value={config.pesoMinimo}
                onChange={(event) => atualizarConfig('pesoMinimo', event.target.value)} disabled={!selecionado} />
            </label>
            <label className="field-label">Peso máx. (kg)
              <input className="field-input" inputMode="decimal" value={config.pesoMaximo}
                onChange={(event) => atualizarConfig('pesoMaximo', event.target.value)} disabled={!selecionado} />
            </label>
          </div>

          <div className="toggle-row">
            <span>Recebe materiais</span>
            <button type="button" role="switch" aria-checked={config.recebeMateriais}
              className={`switch ${config.recebeMateriais ? 'on' : ''}`} disabled={!selecionado}
              onClick={() => atualizarConfig('recebeMateriais', !config.recebeMateriais)}><span /></button>
          </div>
          <div className="toggle-row">
            <span>Coleta em domicílio</span>
            <button type="button" role="switch" aria-checked={config.coletaDomicilio}
              className={`switch ${config.coletaDomicilio ? 'on' : ''}`} disabled={!selecionado}
              onClick={() => atualizarConfig('coletaDomicilio', !config.coletaDomicilio)}><span /></button>
          </div>

          <div className="schedule-editor">
            <div className="section-head">
              <h2>Horários deste ponto</h2>
              <button type="button" className="link-action" disabled={!selecionado} onClick={() =>
                atualizarConfig('funcionamento', [
                  ...config.funcionamento,
                  { diaSemana: 'Seg. a sex.', horarioAbertura: '08:00', horarioFechamento: '17:00' },
                ])
              }><Plus size={14} /> Adicionar</button>
            </div>
            {config.funcionamento.map((item, index) => (
              <div className="schedule-row" key={index}>
                <input className="field-input" aria-label="Dias da semana" value={item.diaSemana ?? ''}
                  onChange={(e) => {
                    const proximo = [...config.funcionamento];
                    proximo[index] = { ...item, diaSemana: e.target.value };
                    atualizarConfig('funcionamento', proximo);
                  }} />
                <input className="field-input" aria-label="Abertura" value={item.horarioAbertura ?? ''}
                  onChange={(e) => {
                    const proximo = [...config.funcionamento];
                    proximo[index] = { ...item, horarioAbertura: e.target.value };
                    atualizarConfig('funcionamento', proximo);
                  }} />
                <input className="field-input" aria-label="Fechamento" value={item.horarioFechamento ?? ''}
                  onChange={(e) => {
                    const proximo = [...config.funcionamento];
                    proximo[index] = { ...item, horarioFechamento: e.target.value };
                    atualizarConfig('funcionamento', proximo);
                  }} />
                <button type="button" className="icon-button" aria-label="Remover horário" onClick={() =>
                  atualizarConfig('funcionamento', config.funcionamento.filter((_, i) => i !== index))
                }><Trash2 size={16} /></button>
              </div>
            ))}
          </div>

          <button type="button" className="green-btn full" onClick={salvar} disabled={salvando || !selecionado}>
            <Save size={17} /> {salvando ? 'Salvando…' : 'Salvar este ponto'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
