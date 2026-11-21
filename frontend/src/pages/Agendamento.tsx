import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { solusApi, type EmpresaDTO, type PontoColetaDTO } from '../api/client';

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function Agendamento() {
  const today = new Date();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const empresaParam = Number(params.get('empresa'));
  const pontoParam = Number(params.get('ponto'));
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState('14:30');
  const [material, setMaterial] = useState('Metal');
  const [peso, setPeso] = useState('10');
  const [observacao, setObservacao] = useState('');
  const [useDefaultAddress, setUseDefaultAddress] = useState(true);
  const [empresa, setEmpresa] = useState<EmpresaDTO | null>(null);
  const [ponto, setPonto] = useState<PontoColetaDTO | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      const [empresas, pontos] = await Promise.all([
        solusApi.empresas(),
        pontoParam ? solusApi.pontos() : Promise.resolve({ data: [] }),
      ]);
      if (!ativo) return;
      const ponto = (pontos.data ?? []).find((item) => item.id === pontoParam);
      const empresaId = ponto?.companyId ?? empresaParam;
      const encontrada = (empresas.data ?? []).find((item) => item.id === empresaId);
      setEmpresa(encontrada ?? empresas.data?.[0] ?? null);
      setPonto(ponto ?? null);
      if (ponto?.tipoResiduo) setMaterial(ponto.tipoResiduo.split(/[,;]/)[0].trim() || 'Metal');
      if (ponto?.pesoMinimoKg != null) setPeso(String(ponto.pesoMinimoKg));
    }
    void carregar();
    return () => {
      ativo = false;
    };
  }, [empresaParam, pontoParam]);

  const { days } = useMemo(() => {
    const first = new Date(currentYear, currentMonth, 1).getDay();
    const count = new Date(currentYear, currentMonth + 1, 0).getDate();
    const list: { day: number; disabled: boolean }[] = [];
    for (let i = 0; i < first; i++) list.push({ day: 0, disabled: true });
    for (let d = 1; d <= count; d++) {
      const isPast =
        currentYear < today.getFullYear() ||
        (currentYear === today.getFullYear() && currentMonth < today.getMonth()) ||
        (currentYear === today.getFullYear() &&
          currentMonth === today.getMonth() &&
          d < today.getDate());
      list.push({ day: d, disabled: isPast });
    }
    return { days: list };
  }, [currentMonth, currentYear]);

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
    setSelectedDay(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!selectedDay) {
      setError('Selecione uma data para a coleta.');
      return;
    }
    if (!empresa) {
      setError('Nenhuma empresa de coleta disponível no momento.');
      return;
    }
    const dd = String(selectedDay).padStart(2, '0');
    const mm = String(currentMonth + 1).padStart(2, '0');
    const scheduleTime = `${dd}/${mm}/${currentYear} ${selectedTime}`;

    setLoading(true);
    const { data, error: err } = await solusApi.criarAgendamento({
      companyId: empresa.id,
      tipoResiduo: material,
      pesoEstimado: Number(peso),
      scheduleTime,
    });
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    navigate('/confirmacao-agendamento', { state: { agendamento: data } });
  }

  return (
    <Layout>
      <div className="agendamento-container">
        <div className="boxed-section">
          <h2>{ponto?.nome ?? empresa?.nomeFantasia ?? empresa?.razaoSocial ?? 'Ponto de coleta'}</h2>
          {(ponto || empresa) && (
            <p className="helper-text">{empresa?.nomeFantasia ?? empresa?.razaoSocial ?? ponto?.endereco}</p>
          )}
        </div>
        <form className="boxed-section" onSubmit={handleSubmit}>
          <p>Quando será sua coleta?</p>
          <div className="calendar-header">
            <button type="button" className="calendar-nav" onClick={prevMonth} aria-label="Mês anterior">
              <ChevronLeft size={22} />
            </button>
            <span>{monthNames[currentMonth]} {currentYear}</span>
            <button type="button" className="calendar-nav" onClick={nextMonth} aria-label="Próximo mês">
              <ChevronRight size={22} />
            </button>
          </div>
          <div className="weekdays">
            <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
          </div>
          <div className="calendar-grid">
            {days.map((item, index) => (
              <div
                key={index}
                className={
                  item.disabled
                    ? 'disabled'
                    : selectedDay === item.day
                      ? 'selected selectable'
                      : 'selectable'
                }
                onClick={() => !item.disabled && setSelectedDay(item.day)}
                role="button"
                tabIndex={item.disabled ? -1 : 0}
                onKeyDown={(e) => {
                  if (!item.disabled && (e.key === 'Enter' || e.key === ' ')) setSelectedDay(item.day);
                }}
                aria-label={item.day ? `${item.day} de ${monthNames[currentMonth]}` : undefined}
              >
                {item.day || ''}
              </div>
            ))}
          </div>

          <p>Quais materiais serão coletados?</p>
          <p className="helper-text">*Essa empresa só realiza coletas de Metal e/ou Vidro</p>
          <select className="custom-select" value={material} onChange={(e) => setMaterial(e.target.value)}>
            <option>Metal</option>
            <option>Vidro</option>
          </select>

          <p>Qual o peso aproximado da sua separação?</p>
          <p className="helper-text">*Essa empresa só realiza coletas a partir de 10kg</p>
          <select className="custom-select" value={peso} onChange={(e) => setPeso(e.target.value)}>
            {['10', '20', '30', '40', '50'].map((value) => (
              <option key={value} value={value}>{value}kg</option>
            ))}
          </select>

          <p>Horário de recebimento</p>
          <select className="custom-select" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
            {['08:00', '09:00', '10:00', '11:00', '14:00', '14:30', '15:00', '16:00'].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>

          <label className="checkbox-label spaced-checkbox">
            <input
              type="checkbox"
              checked={useDefaultAddress}
              onChange={(e) => setUseDefaultAddress(e.target.checked)}
            />
            Utilizar endereço e contatos do cadastro
          </label>

          <p>Tem alguma observação?</p>
          <textarea
            placeholder="Comente sobre seus itens, horários para recebimento, etc.."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />

          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="green-btn" disabled={loading}>
            {loading ? 'Agendando...' : 'Agendar coleta'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
