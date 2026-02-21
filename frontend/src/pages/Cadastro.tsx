import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, type RegisterBody } from '../api/client';

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;
const DIAS_NOMES: Record<string, string> = { Seg: 'Segunda', Ter: 'Terça', Qua: 'Quarta', Qui: 'Quinta', Sex: 'Sexta', Sáb: 'Sábado', Dom: 'Domingo' };
const OPCOES_RECICLA = ['Papel/Papelão', 'Plástico', 'Metal', 'Vidro', 'Resíduos Eletrônicos'];
const OPCOES_KILOS = ['5kg - 10kg', '10kg - 15kg', '15kg - 20kg', 'Acima de 20kg'];
const OPCOES_MEIO_COLETA = ['Carro', 'Moto', 'Bicicleta', 'Van', 'Caminhão'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/** Feriados Nacionais + Estaduais (TO) + Municipais (Palmas) */
const FERIADOS_BR: { dia: number; mes: number; nome: string; tipo: 'nacional' | 'estadual' | 'municipal' }[] = [
  { dia: 1, mes: 0, nome: 'Ano Novo', tipo: 'nacional' },
  { dia: 15, mes: 3, nome: 'Sexta-feira Santa', tipo: 'nacional' },
  { dia: 21, mes: 3, nome: 'Tiradentes', tipo: 'nacional' },
  { dia: 1, mes: 4, nome: 'Dia do Trabalho', tipo: 'nacional' },
  { dia: 7, mes: 8, nome: 'Independência', tipo: 'nacional' },
  { dia: 12, mes: 9, nome: 'Nossa Senhora Aparecida', tipo: 'nacional' },
  { dia: 2, mes: 10, nome: 'Finados', tipo: 'nacional' },
  { dia: 15, mes: 10, nome: 'Proclamação da República', tipo: 'nacional' },
  { dia: 25, mes: 11, nome: 'Natal', tipo: 'nacional' },
  { dia: 27, mes: 8, nome: 'Aniversário de Palmas', tipo: 'municipal' },
];

/** Palmas, TO: lat -10.2105, lon -48.3281 */
const PALMAS_COORDS = { lat: -10.2105, lon: -48.3281 };
const PALMAS_RAIO_KM = 60;

type TabHorario = 'regulares' | 'feriados' | 'datas-especiais';

interface HorarioItem {
  dia?: string;
  abre: string;
  fecha: string;
  dataEspecial?: string;
  feriadoNome?: string;
}

interface HorariosPorDia {
  [dia: string]: Array<{ abre: string; fecha: string }>;
}

export default function Cadastro() {
  const [searchParams] = useSearchParams();
  const fromIndex = searchParams.get('from') === 'index';
  const navigate = useNavigate();

  // Campos de acesso e perfil
  const [tipo, setTipo] = useState<'comunidade' | 'organizacao'>('comunidade');
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');

  // Campos de endereço e geolocalização
  const [cep, setCep] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [endereco, setEndereco] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [cepErro, setCepErro] = useState('');
  const [mostrarMapaPreview, setMostrarMapaPreview] = useState(false);

  // Horários regulares (estrutura: por dia)
  const [diasSelecionados, setDiasSelecionados] = useState<Set<string>>(new Set());
  const [horariosPorDia, setHorariosPorDia] = useState<HorariosPorDia>({});
  
  // Horários de feriados
  const [tabHorario, setTabHorario] = useState<TabHorario>('regulares');
  const [calendarioMes, setCalendarioMes] = useState(new Date().getMonth());
  const [calendarioAno, setCalendarioAno] = useState(new Date().getFullYear());
  const [feriadosSelecionados, setFeriadosSelecionados] = useState<Set<string>>(new Set());
  const [horariosFeriados, setHorariosFeriados] = useState<HorarioItem[]>([]);
  
  // Datas especiais
  const [datasEspeciais, setDatasEspeciais] = useState<{ data: string; nome: string; abre: string; fecha: string }[]>([]);
  const [mostrarAddDataEspecial, setMostrarAddDataEspecial] = useState(false);
  const [novaDataEspecial, setNovaDataEspecial] = useState({ data: '', nome: '', abre: '08:30', fecha: '18:30' });

  // Reciclagem (seleção múltipla)
  const [oQueReciclaSelected, setOQueReciclaSelected] = useState<Set<string>>(new Set());
  const [quantidadeKilosSelected, setQuantidadeKilosSelected] = useState<Set<string>>(new Set());
  const [meioColetaSelected, setMeioColetaSelected] = useState<Set<string>>(new Set());

  // Estado geral
  const [aceitaNotificacoes, setAceitaNotificacoes] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Funções utilitárias
  const formatCPF = (v: string): string => {
    const n = v.replace(/\D/g, '').slice(0, 11);
    if (n.length > 8) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
    if (n.length > 6) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
    if (n.length > 3) return `${n.slice(0, 3)}.${n.slice(3)}`;
    return n;
  };

  const formatCNPJ = (v: string): string => {
    const n = v.replace(/\D/g, '').slice(0, 14);
    if (n.length > 11) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`;
    if (n.length > 8) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`;
    if (n.length > 5) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`;
    if (n.length > 2) return `${n.slice(0, 2)}.${n.slice(2)}`;
    return n;
  };

  const formatDocumento = (v: string): string => {
    const clean = v.replace(/\D/g, '');
    if (clean.length <= 11) return formatCPF(v);
    return formatCNPJ(v);
  };

  const formatTelefone = (v: string): string => {
    const n = v.replace(/\D/g, '').slice(0, 11);
    if (n.length > 6) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
    if (n.length > 2) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
    if (n.length > 0) return `(${n}`;
    return '';
  };

  const formatCep = (v: string): string => {
    const n = v.replace(/\D/g, '').slice(0, 8);
    if (n.length > 5) return `${n.slice(0, 5)}-${n.slice(5)}`;
    return n;
  };

  /** Calcula distância entre dois pontos (Haversine). Retorna km. */
  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Raio da Terra em km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  /** Busca coordenadas a partir do CEP usando API ViaCEP. */
  const buscarCEP = async (cepValue: string) => {
    const cepClean = cepValue.replace(/\D/g, '');
    if (cepClean.length !== 8) {
      setCepErro('CEP deve ter 8 dígitos.');
      return;
    }

    try {
      setCepErro('');
      const res = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
      const data = await res.json();

      if (data.erro) {
        setCepErro('CEP não encontrado.');
        setEndereco('');
        setLatitude(null);
        setLongitude(null);
        return;
      }

      setEndereco(`${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`);

      // Usar a API nominatim do OpenStreetMap para pegar coordenadas
      const coordRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          `${data.logradouro}, ${data.localidade}, ${data.uf}`
        )}`
      );
      const coordData = await coordRes.json();

      if (coordData.length > 0) {
        const { lat, lon } = coordData[0];
        setLatitude(parseFloat(lat));
        setLongitude(parseFloat(lon));

        // Validar raio
        const distancia = calcularDistancia(PALMAS_COORDS.lat, PALMAS_COORDS.lon, parseFloat(lat), parseFloat(lon));
        if (distancia > PALMAS_RAIO_KM) {
          setCepErro(`Endereço está fora da região de Palmas (${Math.round(distancia)}km de distância).`);
          setMostrarMapaPreview(false);
        } else {
          setCepErro('');
          setMostrarMapaPreview(true);
        }
      } else {
        setCepErro('Não foi possível localizar o endereço no mapa.');
        setLatitude(null);
        setLongitude(null);
      }
    } catch (err) {
      setCepErro('Erro ao buscar CEP. Tente novamente.');
      console.error(err);
    }
  };

  // Executar busca de CEP quando mudar
  useEffect(() => {
    if (cep.replace(/\D/g, '').length === 8) {
      const timeout = setTimeout(() => buscarCEP(cep), 500);
      return () => clearTimeout(timeout);
    }
  }, [cep]);

  // Gestão de horários regulares (um campo por dia, possibilidade de múltiplos turnos)
  const toggleDia = (dia: string) => {
    setDiasSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(dia)) {
        next.delete(dia);
        setHorariosPorDia((prev) => {
          const clone = { ...prev };
          delete clone[dia];
          return clone;
        });
      } else {
        next.add(dia);
        setHorariosPorDia((prev) => ({
          ...prev,
          [dia]: [{ abre: '08:30', fecha: '18:30' }],
        }));
      }
      return next;
    });
  };

  const addHorarioParaDia = (dia: string) => {
    setHorariosPorDia((prev) => ({
      ...prev,
      [dia]: [...(prev[dia] || []), { abre: '08:30', fecha: '18:30' }],
    }));
  };

  const updateHorarioDia = (dia: string, idx: number, field: 'abre' | 'fecha', value: string) => {
    setHorariosPorDia((prev) => ({
      ...prev,
      [dia]: prev[dia].map((h, i) => (i === idx ? { ...h, [field]: value } : h)),
    }));
  };

  const removeHorarioDia = (dia: string, idx: number) => {
    setHorariosPorDia((prev) => ({
      ...prev,
      [dia]: prev[dia].filter((_, i) => i !== idx),
    }));
  };

  // Gestão de calendário e feriados
  const diasCalendario = useMemo(() => {
    const first = new Date(calendarioAno, calendarioMes, 1).getDay();
    const count = new Date(calendarioAno, calendarioMes + 1, 0).getDate();
    const list: { day: number; isFeriado?: string; key: string }[] = [];
    for (let i = 0; i < first; i++) list.push({ day: 0, key: `empty-${i}` });
    for (let d = 1; d <= count; d++) {
      const feriado = FERIADOS_BR.find((f) => f.dia === d && f.mes === calendarioMes);
      const key = `${calendarioAno}-${calendarioMes}-${d}`;
      list.push({ day: d, isFeriado: feriado?.nome, key });
    }
    return list;
  }, [calendarioMes, calendarioAno]);

  const navMesAnterior = () => {
    if (calendarioMes === 0) {
      setCalendarioMes(11);
      setCalendarioAno((y) => y - 1);
    } else {
      setCalendarioMes((m) => m - 1);
    }
  };

  const navMesProximo = () => {
    if (calendarioMes === 11) {
      setCalendarioMes(0);
      setCalendarioAno((y) => y + 1);
    } else {
      setCalendarioMes((m) => m + 1);
    }
  };

  const selecionarFeriado = (day: number) => {
    if (day === 0) return;
    const feriadoKey = `${calendarioAno}-${calendarioMes}-${day}`;
    setFeriadosSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(feriadoKey)) {
        next.delete(feriadoKey);
      } else {
        next.add(feriadoKey);
      }
      return next;
    });
  };

  const formatDiaCurto = (d: number, m: number, y: number) => {
    const date = new Date(y, m, d);
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return `${dias[date.getDay()]} ${d} ${MESES[m].slice(0, 3)}`;
  };

  // Adicionar horário para um feriado selecionado
  const addHorarioFeriado = (feriadoKey: string) => {
    const feriado = FERIADOS_BR.find((f) => f.dia === parseInt(feriadoKey.split('-')[2]));
    setHorariosFeriados((prev) => [
      ...prev,
      {
        abre: '08:30',
        fecha: '18:30',
        feriadoNome: feriado?.nome || 'Feriado',
        dataEspecial: feriadoKey,
      },
    ]);
  };

  const updateHorarioFeriado = (idx: number, field: 'abre' | 'fecha', value: string) => {
    setHorariosFeriados((prev) => prev.map((h, i) => (i === idx ? { ...h, [field]: value } : h)));
  };

  const removeHorarioFeriado = (idx: number) => {
    setHorariosFeriados((prev) => prev.filter((_, i) => i !== idx));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validações
    if (senha !== confirmaSenha) {
      setError('As senhas não coincidem.');
      return;
    }
    if (senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (cepErro || !latitude || !longitude) {
      setError('Endereço não validado ou fora da região de Palmas.');
      return;
    }
    if (diasSelecionados.size === 0) {
      setError('Selecione pelo menos um dia de funcionamento.');
      return;
    }

    const docClean = documento.replace(/\D/g, '');
    const documentoTipo: 'cpf' | 'cnpj' = docClean.length <= 11 ? 'cpf' : 'cnpj';

    setLoading(true);

    // Dados do registro
    const body: RegisterBody = {
      nome: nome.trim(),
      email: email.trim(),
      password: senha,
      documento_tipo: documentoTipo,
      documento: docClean,
      telefone: telefone.replace(/\D/g, ''),
      cep: cep.replace(/\D/g, ''),
      numero: numero.trim(),
      complemento: complemento.trim() || undefined,
      aceita_notificacoes: aceitaNotificacoes,
      tipo,
    };

    // Dados adicionais (perfil organizacional)
    const perfilDados = {
      endereco,
      latitude,
      longitude,
      horarios_regulares: Object.entries(horariosPorDia).map(([dia, horarios]) => ({
        dia,
        horarios,
      })),
      horarios_feriados: horariosFeriados,
      datas_especiais: datasEspeciais,
      reciclagem: {
        tipos: Array.from(oQueReciclaSelected),
        quantidades: Array.from(quantidadeKilosSelected),
        meios: Array.from(meioColetaSelected),
      },
    };

    const { error: err } = await authApi.register(body);
    setLoading(false);

    if (err) {
      setError(err);
      return;
    }

    // Guardar dados do perfil no localStorage temporariamente para sincronizar após login
    localStorage.setItem('perfil_pendente', JSON.stringify(perfilDados));

    navigate('/login');
  }

  const backTo = fromIndex ? '/' : '/';

  return (
    <div className="cadastro-page">
      <Link to={backTo} className="back-btn cadastro-back" aria-label="Voltar">
        ←
      </Link>
      <h1 className="cadastro-title">Vamos terminar seu cadastro?</h1>

      <div className="cadastro-tipo">
        <button
          type="button"
          className={`cadastro-tipo-btn ${tipo === 'comunidade' ? 'active' : ''}`}
          onClick={() => setTipo('comunidade')}
        >
          Comunidade
        </button>
        <button
          type="button"
          className={`cadastro-tipo-btn ${tipo === 'organizacao' ? 'active' : ''}`}
          onClick={() => setTipo('organizacao')}
        >
          Organizações Sociais
        </button>
      </div>

      <form className="cadastro-form" onSubmit={handleSubmit}>
        {/* SEÇÃO 1: Identificação Pessoal */}
        <fieldset>
          <legend>Informações Pessoais</legend>
          <input
            type="text"
            placeholder="Nome"
            className="cadastro-input"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="CPF ou CNPJ"
            className="cadastro-input"
            value={documento}
            onChange={(e) => setDocumento(formatDocumento(e.target.value))}
            required
          />
          <input
            type="tel"
            placeholder="Telefone"
            className="cadastro-input"
            value={telefone}
            onChange={(e) => setTelefone(formatTelefone(e.target.value))}
            required
          />
        </fieldset>

        {/* SEÇÃO 2: Acesso */}
        <fieldset>
          <legend>Acesso</legend>
          <input
            type="email"
            placeholder="E-mail"
            className="cadastro-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            className="cadastro-input"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
          />
          <input
            type="password"
            placeholder="Confirmar Senha"
            className="cadastro-input"
            value={confirmaSenha}
            onChange={(e) => setConfirmaSenha(e.target.value)}
            required
          />
        </fieldset>

        {/* SEÇÃO 3: Endereço e Geolocalização */}
        <fieldset>
          <legend>Localização</legend>
          <input
            type="text"
            placeholder="CEP"
            className="cadastro-input"
            value={cep}
            onChange={(e) => setCep(formatCep(e.target.value))}
            required
          />
          {cepErro && <p className="form-error">{cepErro}</p>}
          {endereco && <p className="cadastro-endereco-info">📍 {endereco}</p>}

          {mostrarMapaPreview && latitude && longitude && (
            <div className="cadastro-mapa">
              <div className="cadastro-mapa-inner">
                <span className="cadastro-mapa-pin">✓</span>
                <p className="cadastro-mapa-texto">Endereço validado em Palmas, TO</p>
              </div>
            </div>
          )}

          <div className="cadastro-row">
            <input
              type="text"
              placeholder="Número"
              className="cadastro-input"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Complemento"
              className="cadastro-input"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
            />
          </div>
        </fieldset>

        <section className="cadastro-section">
          <h2 className="cadastro-section-title">Horários e Dias de Funcionamento</h2>
          <div className="cadastro-tabs">
            <button
              type="button"
              className={`cadastro-tab ${tabHorario === 'regulares' ? 'active' : ''}`}
              onClick={() => setTabHorario('regulares')}
            >
              Regulares
            </button>
            <button
              type="button"
              className={`cadastro-tab ${tabHorario === 'feriados' ? 'active' : ''}`}
              onClick={() => setTabHorario('feriados')}
            >
              Feriados
            </button>
            <button
              type="button"
              className={`cadastro-tab ${tabHorario === 'datas-especiais' ? 'active' : ''}`}
              onClick={() => setTabHorario('datas-especiais')}
            >
              Datas Especiais
            </button>
          </div>

          {/* TAB: REGULARES */}
          {tabHorario === 'regulares' && (
            <>
              <p className="cadastro-hint">Selecione os dias de funcionamento.</p>
              <div className="cadastro-dias">
                {DIAS_SEMANA.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`cadastro-dia-btn ${diasSelecionados.has(d) ? 'selected' : ''}`}
                    onClick={() => toggleDia(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Horários por dia selecionado */}
              {Array.from(diasSelecionados).map((dia) => (
                <div key={dia} className="cadastro-dia-horarios">
                  <h3>{DIAS_NOMES[dia] || dia}</h3>
                  {(horariosPorDia[dia] || []).map((h, idx) => (
                    <div key={idx} className="cadastro-horario-row">
                      <input
                        type="time"
                        className="cadastro-input time"
                        value={h.abre}
                        onChange={(e) => updateHorarioDia(dia, idx, 'abre', e.target.value)}
                      />
                      <span className="cadastro-horario-sep">até</span>
                      <input
                        type="time"
                        className="cadastro-input time"
                        value={h.fecha}
                        onChange={(e) => updateHorarioDia(dia, idx, 'fecha', e.target.value)}
                      />
                      {(horariosPorDia[dia] || []).length > 1 && (
                        <button
                          type="button"
                          className="cadastro-icon-btn"
                          onClick={() => removeHorarioDia(dia, idx)}
                          aria-label="Excluir"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="cadastro-add-horario"
                    onClick={() => addHorarioParaDia(dia)}
                  >
                    <span className="plus">+</span> Adicionar Horário
                  </button>
                </div>
              ))}
            </>
          )}

          {/* TAB: FERIADOS */}
          {tabHorario === 'feriados' && (
            <>
              <p className="cadastro-hint">Selecione os feriados e configure horários especiais.</p>
              <div className="cadastro-calendario">
                <div className="cadastro-calendario-header">
                  <button type="button" onClick={navMesAnterior} aria-label="Mês anterior">
                    ←
                  </button>
                  <span>
                    {MESES[calendarioMes]} {calendarioAno}
                  </span>
                  <button type="button" onClick={navMesProximo} aria-label="Próximo mês">
                    →
                  </button>
                </div>
                <div className="cadastro-calendario-dias">
                  <span>Dom</span>
                  <span>Seg</span>
                  <span>Ter</span>
                  <span>Qua</span>
                  <span>Qui</span>
                  <span>Sex</span>
                  <span>Sáb</span>
                </div>
                <div className="cadastro-calendario-grid">
                  {diasCalendario.map((item) => {
                    const feriadoKey = `${calendarioAno}-${calendarioMes}-${item.day}`;
                    const isFeriadoSelected = feriadosSelecionados.has(feriadoKey);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`cadastro-calendario-dia ${item.day === 0 ? 'vazio' : ''} ${
                          isFeriadoSelected ? 'selected' : ''
                        } ${item.isFeriado ? 'feriado' : ''}`}
                        onClick={() => selecionarFeriado(item.day)}
                        title={item.isFeriado || ''}
                      >
                        {item.day || ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horários para feriados selecionados */}
              {Array.from(feriadosSelecionados).map((feriadoKey) => {
                const [ano, mes, dia] = feriadoKey.split('-').map(Number);
                const feriado = FERIADOS_BR.find((f) => f.dia === dia && f.mes === mes);
                return (
                  <div key={feriadoKey} className="cadastro-feriado-horarios">
                    <h3>
                      {formatDiaCurto(dia, mes, ano)} {feriado?.nome && `(${feriado.nome})`}
                    </h3>
                    {horariosFeriados
                      .filter((h) => h.dataEspecial === feriadoKey)
                      .map((h, idx) => (
                        <div key={idx} className="cadastro-horario-row">
                          <input
                            type="time"
                            className="cadastro-input time"
                            value={h.abre}
                            onChange={(e) => updateHorarioFeriado(idx, 'abre', e.target.value)}
                          />
                          <span className="cadastro-horario-sep">até</span>
                          <input
                            type="time"
                            className="cadastro-input time"
                            value={h.fecha}
                            onChange={(e) => updateHorarioFeriado(idx, 'fecha', e.target.value)}
                          />
                          <button
                            type="button"
                            className="cadastro-icon-btn"
                            onClick={() => removeHorarioFeriado(idx)}
                            aria-label="Excluir"
                          >
                            🗑
                          </button>
                        </div>
                      ))}
                    {!horariosFeriados.some((h) => h.dataEspecial === feriadoKey) && (
                      <button
                        type="button"
                        className="cadastro-add-horario"
                        onClick={() => addHorarioFeriado(feriadoKey)}
                      >
                        <span className="plus">+</span> Adicionar Horário
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* TAB: DATAS ESPECIAIS */}
          {tabHorario === 'datas-especiais' && (
            <>
              {datasEspeciais.map((d, idx) => (
                <div key={idx} className="cadastro-data-especial">
                  <span>{d.data} - {d.nome}</span>
                  <button
                    type="button"
                    className="cadastro-icon-btn"
                    onClick={() => setDatasEspeciais((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label="Excluir"
                  >
                    🗑
                  </button>
                </div>
              ))}
              {!mostrarAddDataEspecial && (
                <button
                  type="button"
                  className="cadastro-add-data-especial"
                  onClick={() => setMostrarAddDataEspecial(true)}
                >
                  + Adicionar data especial
                </button>
              )}
              {mostrarAddDataEspecial && (
                <div className="cadastro-nova-data-especial">
                  <input
                    type="date"
                    className="cadastro-input"
                    value={novaDataEspecial.data}
                    onChange={(e) => setNovaDataEspecial((prev) => ({ ...prev, data: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Nome da data (ex: Aniversário)"
                    className="cadastro-input"
                    value={novaDataEspecial.nome}
                    onChange={(e) => setNovaDataEspecial((prev) => ({ ...prev, nome: e.target.value }))}
                  />
                  <input
                    type="time"
                    className="cadastro-input time"
                    value={novaDataEspecial.abre}
                    onChange={(e) => setNovaDataEspecial((prev) => ({ ...prev, abre: e.target.value }))}
                  />
                  <input
                    type="time"
                    className="cadastro-input time"
                    value={novaDataEspecial.fecha}
                    onChange={(e) => setNovaDataEspecial((prev) => ({ ...prev, fecha: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="cadastro-add-horario"
                    onClick={() => {
                      if (novaDataEspecial.data && novaDataEspecial.nome) {
                        setDatasEspeciais((prev) => [...prev, novaDataEspecial]);
                        setNovaDataEspecial({ data: '', nome: '', abre: '08:30', fecha: '18:30' });
                        setMostrarAddDataEspecial(false);
                      }
                    }}
                  >
                    Salvar
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* SEÇÃO 4: Reciclagem (Seleção Múltipla) */}
        <fieldset>
          <legend>Categorização de Reciclagem</legend>

          <div className="cadastro-checkbox-group">
            <label className="cadastro-label">O que você recicla?</label>
            {OPCOES_RECICLA.map((op) => (
              <label key={op} className="cadastro-checkbox">
                <input
                  type="checkbox"
                  checked={oQueReciclaSelected.has(op)}
                  onChange={(e) => {
                    setOQueReciclaSelected((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(op);
                      else next.delete(op);
                      return next;
                    });
                  }}
                />
                {op}
              </label>
            ))}
          </div>

          <div className="cadastro-checkbox-group">
            <label className="cadastro-label">Quantidade de quilos processados?</label>
            {OPCOES_KILOS.map((op) => (
              <label key={op} className="cadastro-checkbox">
                <input
                  type="checkbox"
                  checked={quantidadeKilosSelected.has(op)}
                  onChange={(e) => {
                    setQuantidadeKilosSelected((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(op);
                      else next.delete(op);
                      return next;
                    });
                  }}
                />
                {op}
              </label>
            ))}
          </div>

          <div className="cadastro-checkbox-group">
            <label className="cadastro-label">Meios de coleta disponíveis?</label>
            {OPCOES_MEIO_COLETA.map((op) => (
              <label key={op} className="cadastro-checkbox">
                <input
                  type="checkbox"
                  checked={meioColetaSelected.has(op)}
                  onChange={(e) => {
                    setMeioColetaSelected((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(op);
                      else next.delete(op);
                      return next;
                    });
                  }}
                />
                {op}
              </label>
            ))}
          </div>
        </fieldset>

        {/* SEÇÃO 5: Opções Gerais */}
        <fieldset>
          <legend>Preferências</legend>
          <label className="cadastro-checkbox">
            <input type="checkbox" checked={aceitaNotificacoes} onChange={(e) => setAceitaNotificacoes(e.target.checked)} />
            Aceito receber notificações do app
          </label>
        </fieldset>

        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="cadastro-submit" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>
    </div>
  );
}
