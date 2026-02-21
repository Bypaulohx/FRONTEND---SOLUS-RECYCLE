import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Agendamento() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [material, setMaterial] = useState('Metal');
  const [peso, setPeso] = useState('10');
  const [observacao, setObservacao] = useState('');

  const { days } = useMemo(() => {
    const first = new Date(currentYear, currentMonth, 1).getDay();
    const count = new Date(currentYear, currentMonth + 1, 0).getDate();
    const list: { day: number; disabled: boolean }[] = [];
    for (let i = 0; i < first; i++) list.push({ day: 0, disabled: true });
    for (let d = 1; d <= count; d++) {
      const isPast = currentYear < today.getFullYear() || (currentYear === today.getFullYear() && currentMonth < today.getMonth()) || (currentYear === today.getFullYear() && currentMonth === today.getMonth() && d < today.getDate());
      list.push({ day: d, disabled: isPast });
    }
    return { days: list };
  }, [currentMonth, currentYear]);

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  }

  return (
    <Layout>
      <div className="agendamento-container">
        <Link to="/mapa" className="back-btn">←</Link>
        <div className="boxed-section">
          <h2>Associação dos Catadores de Material Reciclável - ASCAS</h2>
        </div>
        <div className="boxed-section">
          <p>Quando será sua coleta?</p>
          <div className="calendar-header">
            <i className="bi bi-chevron-compact-left" style={{ cursor: 'pointer' }} onClick={prevMonth} role="button" />
            <span>{monthNames[currentMonth]} {currentYear}</span>
            <i className="bi bi-chevron-compact-right" style={{ cursor: 'pointer' }} onClick={nextMonth} role="button" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8, fontSize: 12, color: '#666' }}>
            <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
          </div>
          <div className="calendar-grid">
            {days.map((item, i) => (
              <div
                key={i}
                className={item.disabled ? 'disabled' : selectedDay === item.day ? 'selected selectable' : 'selectable'}
                onClick={() => !item.disabled && setSelectedDay(item.day)}
                style={item.day === 0 ? { visibility: 'hidden' } : undefined}
              >
                {item.day || ''}
              </div>
            ))}
          </div>
          <p>Quais materiais serão coletados?</p>
          <p style={{ fontSize: 12, color: '#666' }}>Essa empresa só realiza coletas de Metal e/ou Vidro</p>
          <select className="custom-select" value={material} onChange={(e) => setMaterial(e.target.value)}>
            <option>Metal</option>
            <option>Vidro</option>
          </select>
          <p>Qual o peso aproximado da sua separação?</p>
          <p style={{ fontSize: 12, color: '#666' }}>Essa empresa só realiza coletas a partir de 10kg</p>
          <select className="custom-select" value={peso} onChange={(e) => setPeso(e.target.value)}>
            {['10', '20', '30', '40', '50'].map((k) => <option key={k} value={k}>{k}kg</option>)}
          </select>
          <p>Tem alguma observação?</p>
          <textarea placeholder="Comente sobre seus itens, horários para recebimento, etc.." value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          <Link to="/confirmacao-agendamento" className="green-btn">Agendar coleta</Link>
        </div>
      </div>
    </Layout>
  );
}
