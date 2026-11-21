import { useEffect, useState } from 'react';
import { CalendarDays, ImagePlus, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { authApi, type FeriadoBody } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { digits, formatPhone } from '../utils/format';
import { buscarFeriados, type Feriado } from '../utils/holidays';

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function feriadosSalvos(valor: string | undefined): Feriado[] {
  if (!valor) return [];
  try {
    const dados = JSON.parse(valor) as FeriadoBody[];
    return dados.map((item) => ({
      data: item.data,
      motivo: item.motivo ?? 'Feriado',
      tipo: item.tipo ?? 'municipal',
    }));
  } catch {
    return [];
  }
}

export default function EmpresaDados() {
  const { user, refreshUser } = useAuth();
  const [nomeFantasia, setNomeFantasia] = useState(user?.nomeFantasia ?? '');
  const [razaoSocial, setRazaoSocial] = useState(user?.razaoSocial ?? '');
  const [descricao, setDescricao] = useState(user?.descricao ?? '');
  const [telefone, setTelefone] = useState(formatPhone(user?.telefone ?? ''));
  const [materiais, setMateriais] = useState((user?.materiaisColeta ?? '').split(',').filter(Boolean).join(', '));
  const [pesoMinimo, setPesoMinimo] = useState(user?.pesoMinimoKg != null ? String(user.pesoMinimoKg) : '');
  const [pesoMaximo, setPesoMaximo] = useState(user?.pesoMaximoKg != null ? String(user.pesoMaximoKg) : '');
  const [dias, setDias] = useState<string[]>((user?.diasFuncionamento ?? '').split(',').filter(Boolean));
  const [feriados, setFeriados] = useState<Feriado[]>(feriadosSalvos(user?.feriados));
  const [imagemLocal, setImagemLocal] = useState<string | undefined>(user?.imagemLocal);
  const [uf, setUf] = useState(user?.endereco?.estado ?? 'SP');
  const [municipio, setMunicipio] = useState(user?.endereco?.cidade ?? 'São Paulo');
  const [carregandoFeriados, setCarregandoFeriados] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  // O perfil da organização chega de forma assíncrona via /api/auth/me.
  useEffect(() => {
    if (!user) return;
    setNomeFantasia(user.nomeFantasia ?? '');
    setRazaoSocial(user.razaoSocial ?? '');
    setDescricao(user.descricao ?? '');
    setTelefone(formatPhone(user.telefone ?? ''));
    setMateriais((user.materiaisColeta ?? '').split(',').filter(Boolean).join(', '));
    setPesoMinimo(user.pesoMinimoKg != null ? String(user.pesoMinimoKg) : '');
    setPesoMaximo(user.pesoMaximoKg != null ? String(user.pesoMaximoKg) : '');
    setDias((user.diasFuncionamento ?? '').split(',').filter(Boolean));
    setFeriados(feriadosSalvos(user.feriados));
    setImagemLocal(user.imagemLocal);
    setUf(user.endereco?.estado ?? 'SP');
    setMunicipio(user.endereco?.cidade ?? 'São Paulo');
  }, [user]);

  function alternarDia(dia: string) {
    setDias((atual) => (atual.includes(dia) ? atual.filter((item) => item !== dia) : [...atual, dia]));
  }

  async function carregarFeriados() {
    setCarregandoFeriados(true);
    setErro('');
    const encontrados = await buscarFeriados(new Date().getFullYear(), uf, municipio);
    setCarregandoFeriados(false);
    setFeriados((atual) => {
      const mapa = new Map(atual.map((item) => [item.data, item]));
      encontrados.forEach((item) => mapa.set(item.data, item));
      return [...mapa.values()].sort((a, b) => a.data.localeCompare(b.data));
    });
    setMensagem(`${encontrados.length} feriados encontrados na BrasilAPI.`);
  }

  function selecionarImagem(arquivo: File | undefined) {
    if (!arquivo) return;
    if (arquivo.size > 2 * 1024 * 1024) {
      setErro('A imagem deve ter no máximo 2 MB.');
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => setImagemLocal(typeof leitor.result === 'string' ? leitor.result : undefined);
    leitor.readAsDataURL(arquivo);
  }

  async function salvar() {
    setSalvando(true);
    setErro('');
    setMensagem('');
    const { error } = await authApi.updateCompany({
      nomeFantasia,
      razaoSocial,
      descricao,
      telefone: digits(telefone, 11),
      materiaisColeta: materiais.split(',').map((item) => item.trim()).filter(Boolean),
      pesoMinimoKg: pesoMinimo ? Number(pesoMinimo.replace(',', '.')) : null,
      pesoMaximoKg: pesoMaximo ? Number(pesoMaximo.replace(',', '.')) : null,
      diasFuncionamento: dias,
      feriados: feriados.map((item) => ({ data: item.data, motivo: item.motivo, tipo: item.tipo })),
      imagemLocal,
    });
    setSalvando(false);
    if (error) {
      setErro(error);
      return;
    }
    await refreshUser();
    setMensagem('Dados da organização salvos.');
  }

  return (
    <div className="company-settings">
      {mensagem && <p className="form-success">{mensagem}</p>}
      {erro && <p className="form-error">{erro}</p>}

      <h3 className="section-head-title">Dados da organização</h3>
      <label className="field-label">Nome fantasia
        <input className="field-input" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
      </label>
      <label className="field-label">Razão social
        <input className="field-input" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} />
      </label>
      <label className="field-label">Descrição
        <input className="field-input" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </label>
      <label className="field-label">Telefone
        <input className="field-input" type="tel" value={telefone} onChange={(e) => setTelefone(formatPhone(e.target.value))} />
      </label>

      <h3 className="section-head-title">Operação</h3>
      <label className="field-label">Materiais aceitos
        <input className="field-input" placeholder="Papel, Plástico, Vidro" value={materiais} onChange={(e) => setMateriais(e.target.value)} />
      </label>
      <div className="field-row">
        <label className="field-label">Peso mín. (kg)
          <input className="field-input" inputMode="decimal" value={pesoMinimo} onChange={(e) => setPesoMinimo(e.target.value)} />
        </label>
        <label className="field-label">Peso máx. (kg)
          <input className="field-input" inputMode="decimal" value={pesoMaximo} onChange={(e) => setPesoMaximo(e.target.value)} />
        </label>
      </div>
      <div className="day-chips">
        {DIAS.map((dia) => (
          <button
            key={dia}
            type="button"
            className={`day-chip ${dias.includes(dia) ? 'active' : ''}`}
            aria-pressed={dias.includes(dia)}
            onClick={() => alternarDia(dia)}
          >
            {dia}
          </button>
        ))}
      </div>

      <h3 className="section-head-title">Feriados</h3>
      <div className="field-row">
        <label className="field-label">UF
          <input className="field-input" value={uf} maxLength={2} onChange={(e) => setUf(e.target.value.toUpperCase())} />
        </label>
        <label className="field-label">Município
          <input className="field-input" value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
        </label>
      </div>
      <button type="button" className="green-btn outline-btn full" onClick={carregarFeriados} disabled={carregandoFeriados}>
        {carregandoFeriados ? <LoaderCircle size={16} className="spin" /> : <CalendarDays size={16} />}
        Buscar feriados na BrasilAPI
      </button>
      <div className="holiday-list">
        {feriados.map((feriado) => (
          <div className="holiday-row" key={`${feriado.data}-${feriado.motivo}`}>
            <span>{feriado.data.split('-').reverse().join('/')}</span>
            <strong>{feriado.motivo}</strong>
            <small>{feriado.tipo}</small>
            <button type="button" className="icon-button" aria-label={`Remover ${feriado.motivo}`}
              onClick={() => setFeriados((atual) => atual.filter((item) => item !== feriado))}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <button type="button" className="link-action" onClick={() =>
          setFeriados((atual) => [
            ...atual,
            { data: new Date().toISOString().slice(0, 10), motivo: 'Novo feriado', tipo: 'municipal' },
          ])
        }><Plus size={14} /> Adicionar feriado manual</button>
      </div>

      <h3 className="section-head-title">Imagem do local</h3>
      <label className="photo-upload">
        <input type="file" accept="image/*" onChange={(e) => selecionarImagem(e.target.files?.[0])} />
        {imagemLocal ? <img src={imagemLocal} alt="Imagem do local" /> : <><ImagePlus size={22} /><span>Enviar foto do local</span></>}
      </label>

      <button type="button" className="green-btn full spaced-top" onClick={salvar} disabled={salvando}>
        {salvando ? 'Salvando…' : 'Salvar dados da organização'}
      </button>
    </div>
  );
}
