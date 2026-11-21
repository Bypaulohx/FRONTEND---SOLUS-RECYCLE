import { useMemo, useState } from 'react';
import { Download, Recycle, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';
import { getMaterialLots } from '../utils/operations';

export default function MateriaisEmpresa() {
  const [mensagem, setMensagem] = useState('');
  const lotes = useMemo(() => getMaterialLots(), []);
  const totalKg = lotes.reduce((soma, lote) => soma + lote.weightKg, 0);

  function exportarRelatorio() {
    const linhas = [
      'Lote;Material;Peso (kg);Origem;Data;Destino',
      ...lotes.map((lote) =>
        [lote.id, lote.material, lote.weightKg.toFixed(1), lote.origin, lote.date, lote.destination].join(';')
      ),
    ];
    const url = URL.createObjectURL(new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'solus-relatorio-materiais.csv';
    link.click();
    URL.revokeObjectURL(url);
    setMensagem('Relatório de impactos gerado com sucesso.');
  }

  return (
    <Layout>
      <div className="ops-page">
        <div className="ops-header">
          <div>
            <p className="ops-eyebrow">Reciclagem da organização</p>
            <h1>Materiais e impacto</h1>
            <p className="ops-subtitle">Lotes confirmados por QR</p>
          </div>
          <Recycle size={26} className="ops-header-icon" />
        </div>

        {mensagem && <p className="form-success">{mensagem}</p>}

        <div className="kpi-row">
          <div className="kpi-card featured"><strong>{lotes.length}</strong><span>lotes</span></div>
          <div className="kpi-card"><strong>{totalKg.toFixed(1)}</strong><span>kg recebidos</span></div>
          <div className="kpi-card"><strong>{(totalKg * 0.42).toFixed(1)}</strong><span>kg CO₂ evitados</span></div>
        </div>

        <div className="section-head">
          <h2>Lotes recebidos</h2>
          <TrendingUp size={17} className="ops-header-icon" />
        </div>

        <div className="ops-stack">
          {lotes.map((lote) => (
            <article className="material-card" key={lote.id}>
              <div className="material-top">
                <strong>{lote.material}</strong>
                <span className="material-weight">{lote.weightKg.toFixed(1)} kg</span>
              </div>
              <p>Lote {lote.id} · {lote.date}</p>
              <p>Origem: {lote.origin}</p>
              <p>Destino: {lote.destination}</p>
            </article>
          ))}
        </div>

        <div className="ops-shortcuts">
          <button type="button" onClick={exportarRelatorio}><Download size={18} /> Gerar relatório CSV</button>
        </div>

        <p className="rewards-footnote">
          Relatórios auditáveis e venda de materiais no marketplace financiam o serviço sem anúncios nem cobrança ao usuário.
        </p>
      </div>
    </Layout>
  );
}
