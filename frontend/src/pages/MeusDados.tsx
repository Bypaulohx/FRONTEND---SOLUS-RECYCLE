import { useEffect, useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import BackButton from '../components/BackButton';
import EmpresaDados from '../components/EmpresaDados';
import Layout from '../components/Layout';
import { authApi, type EnderecoBody } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { digits, formatCep, formatPhone } from '../utils/format';

type Campo = 'telefone' | 'endereco' | null;

export default function MeusDados() {
  const { user, role, refreshUser } = useAuth();
  const endereco = user?.endereco;
  const [editando, setEditando] = useState<Campo>(null);
  const [telefone, setTelefone] = useState(formatPhone(user?.telefone ?? ''));
  const [formEndereco, setFormEndereco] = useState<EnderecoBody>({
    cep: endereco?.cep ?? '',
    rua: endereco?.rua ?? '',
    numero: endereco?.numero ?? '',
    complemento: endereco?.complemento ?? '',
    bairro: endereco?.bairro ?? '',
    cidade: endereco?.cidade ?? '',
    estado: endereco?.estado ?? '',
  });
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  // O perfil é carregado de forma assíncrona; sincroniza os formulários quando ele chega.
  useEffect(() => {
    setTelefone(formatPhone(user?.telefone ?? ''));
    setFormEndereco({
      cep: endereco?.cep ?? '',
      rua: endereco?.rua ?? '',
      numero: endereco?.numero ?? '',
      complemento: endereco?.complemento ?? '',
      bairro: endereco?.bairro ?? '',
      cidade: endereco?.cidade ?? '',
      estado: endereco?.estado ?? '',
    });
  }, [user?.telefone, endereco]);

  async function salvarTelefone() {
    setErro('');
    const { error } = await authApi.updatePhone(digits(telefone, 11));
    if (error) {
      setErro(error);
      return;
    }
    await refreshUser();
    setMensagem('Telefone atualizado com sucesso.');
    setEditando(null);
  }

  async function salvarEndereco() {
    setErro('');
    const { error } = await authApi.updateAddress({
      ...formEndereco,
      cep: digits(formEndereco.cep ?? '', 8),
    });
    if (error) {
      setErro(error);
      return;
    }
    await refreshUser();
    setMensagem('Endereço atualizado com sucesso.');
    setEditando(null);
  }

  function atualizarCampo(campo: keyof EnderecoBody, valor: string) {
    setFormEndereco((atual) => ({ ...atual, [campo]: valor }));
  }

  return (
    <Layout>
      <div className="content-container">
        <BackButton to="/perfil" />
        <h2 className="section-title">Meus dados</h2>
        {mensagem && <p className="form-success">{mensagem}</p>}
        {erro && <p className="form-error">{erro}</p>}

        <ul className="data-list">
          <li className="data-item">
            <span className="data-label">Nome</span>
            <div className="data-card"><span className="data-value">{user?.nome ?? '-'}</span></div>
          </li>
          <li className="data-item">
            <span className="data-label">E-mail</span>
            <div className="data-card"><span className="data-value">{user?.email ?? '-'}</span></div>
          </li>

          <li className="data-item">
            <span className="data-label">Telefone</span>
            {editando === 'telefone' ? (
              <div className="field-row">
                <input
                  className="field-input"
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  aria-label="Telefone"
                />
                <button type="button" className="mini-btn primary" onClick={salvarTelefone}>
                  <Check size={15} /> Salvar
                </button>
              </div>
            ) : (
              <div className="data-card">
                <span className="data-value">{formatPhone(user?.telefone ?? '') || '-'}</span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Editar telefone"
                  onClick={() => setEditando('telefone')}
                >
                  <Pencil size={16} />
                </button>
              </div>
            )}
          </li>

          <li className="data-item">
            <span className="data-label">Endereço</span>
            {editando === 'endereco' ? (
              <div className="address-form">
                <label className="field-label">CEP
                  <input
                    className="field-input"
                    value={formEndereco.cep ?? ''}
                    onChange={(e) => atualizarCampo('cep', formatCep(e.target.value))}
                    placeholder="00000-000"
                  />
                </label>
                <label className="field-label">Rua
                  <input className="field-input" value={formEndereco.rua ?? ''} onChange={(e) => atualizarCampo('rua', e.target.value)} />
                </label>
                <div className="field-row">
                  <label className="field-label">Número
                    <input className="field-input" value={formEndereco.numero ?? ''} onChange={(e) => atualizarCampo('numero', e.target.value)} />
                  </label>
                  <label className="field-label">Complemento
                    <input className="field-input" value={formEndereco.complemento ?? ''} onChange={(e) => atualizarCampo('complemento', e.target.value)} />
                  </label>
                </div>
                <label className="field-label">Bairro
                  <input className="field-input" value={formEndereco.bairro ?? ''} onChange={(e) => atualizarCampo('bairro', e.target.value)} />
                </label>
                <div className="field-row">
                  <label className="field-label">Cidade
                    <input className="field-input" value={formEndereco.cidade ?? ''} onChange={(e) => atualizarCampo('cidade', e.target.value)} />
                  </label>
                  <label className="field-label">UF
                    <input className="field-input" value={formEndereco.estado ?? ''} onChange={(e) => atualizarCampo('estado', e.target.value.toUpperCase().slice(0, 2))} />
                  </label>
                </div>
                <button type="button" className="mini-btn primary" onClick={salvarEndereco}>
                  <Check size={15} /> Salvar endereço
                </button>
              </div>
            ) : (
              <>
                <div className="address-details">
                  <div><span>CEP</span><strong>{endereco?.cep ?? '-'}</strong></div>
                  <div><span>Rua</span><strong>{endereco?.rua ?? '-'}, {endereco?.numero ?? '-'}</strong></div>
                  <div><span>Complemento</span><strong>{endereco?.complemento || 'Não informado'}</strong></div>
                  <div><span>Bairro</span><strong>{endereco?.bairro ?? '-'}</strong></div>
                  <div><span>Cidade/UF</span><strong>{endereco?.cidade ?? '-'}/{endereco?.estado ?? '-'}</strong></div>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Editar endereço"
                  onClick={() => setEditando('endereco')}
                >
                  <Pencil size={16} />
                </button>
              </>
            )}
          </li>
        </ul>
        {role === 'COMPANY' && <EmpresaDados />}
      </div>
    </Layout>
  );
}
